import { DirectiveWrapper, InvalidDirectiveError, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerResolverProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import {
  DirectiveNode,
  EnumTypeDefinitionNode,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
} from 'graphql';
import { isListType, isScalarOrEnum } from 'graphql-transformer-common';
import { appendSecondaryIndex, constructSyncVTL, updateResolversForIndex } from './resolvers';
import { addKeyConditionInputs, ensureQueryField, updateMutationConditionInput } from './schema';
import { IndexDirectiveConfiguration } from './types';
import { validateNotSelfReferencing } from './utils';

const directiveName = 'index';
const directiveDefinition = `
  directive @${directiveName}(name: String!, sortKeyFields: [String], queryField: String) repeatable on FIELD_DEFINITION
`;

/**
 *
 */
export class IndexTransformer extends TransformerPluginBase {
  private directiveList: IndexDirectiveConfiguration[] = [];
  private resolverMap: Map<TransformerResolverProvider, string> = new Map();

  constructor() {
    super('amplify-index-transformer', directiveDefinition);
  }

  field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    context: TransformerSchemaVisitStepContextProvider,
  ): void => {
    const directiveWrapped = new DirectiveWrapper(directive);
    const args = directiveWrapped.getArguments({
      object: parent as ObjectTypeDefinitionNode,
      field: definition,
      directive,
    } as IndexDirectiveConfiguration);

    if (!args.sortKeyFields) {
      args.sortKeyFields = [];
    } else if (!Array.isArray(args.sortKeyFields)) {
      args.sortKeyFields = [args.sortKeyFields];
    }

    args.sortKey = [];

    validate(args, context as TransformerContextProvider);
    this.directiveList.push(args);
  };

  public after = (ctx: TransformerContextProvider): void => {
    if (!ctx.isProjectUsingDataStore()) return;

    // construct sync VTL code
    this.resolverMap.forEach((syncVTLContent, resource) => {
      if (syncVTLContent) {
        constructSyncVTL(syncVTLContent, resource);
      }
    });
  };

  transformSchema = (ctx: TransformerTransformSchemaStepContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      ensureQueryField(config, context);
      addKeyConditionInputs(config, context);
      updateMutationConditionInput(config, context);
    }
  };

  generateResolvers = (ctx: TransformerContextProvider): void => {
    for (const config of this.directiveList) {
      appendSecondaryIndex(config, ctx);
      updateResolversForIndex(config, ctx, this.resolverMap);
    }
  };
}

const validate = (config: IndexDirectiveConfiguration, ctx: TransformerContextProvider): void => {
  const {
    name, object, field, sortKeyFields,
  } = config;
  const defaultGSI = ctx.featureFlags.getBoolean('secondaryKeyAsGSI', true);

  validateNotSelfReferencing(config);

  const modelDirective = object.directives!.find(directive => directive.name.value === 'model');

  if (!modelDirective) {
    throw new InvalidDirectiveError(`The @${directiveName} directive may only be added to object definitions annotated with @model.`);
  }

  config.modelDirective = modelDirective;

  const fieldMap = new Map<string, FieldDefinitionNode>();

  for (const objectField of object.fields!) {
    fieldMap.set(objectField.name.value, objectField);

    for (const peerDirective of objectField.directives!) {
      if (peerDirective === config.directive) {
        continue;
      }

      if (peerDirective.name.value === 'primaryKey') {
        const hasSortFields = peerDirective.arguments!.some((arg: any) => arg.name.value === 'sortKeyFields' && arg.value.values?.length > 0);
        config.primaryKeyField = objectField;

        if (!hasSortFields && objectField.name.value === field.name.value) {
          throw new InvalidDirectiveError(
            `Invalid @index '${name}'. You may not create an index where the partition key `
              + 'is the same as that of the primary key unless the primary key has a sort field. '
              + 'You cannot have a local secondary index without a sort key in the primary key.',
          );
        }
      }

      if (
        peerDirective.name.value === directiveName
        && peerDirective.arguments!.some((arg: any) => arg.name.value === 'name' && arg.value.value === name)
      ) {
        throw new InvalidDirectiveError(
          `You may only supply one @${directiveName} with the name '${name}' on type '${object.name.value}'.`,
        );
      }
    }

    for (const peerDirective of objectField.directives!) {
      const hasSortFields = peerDirective.arguments!.some((arg: any) => arg.name.value === 'sortKeyFields' && arg.value.values?.length > 0);

      if (!defaultGSI && !hasSortFields && objectField == config.primaryKeyField && objectField.name.value === field.name.value) {
        throw new InvalidDirectiveError(
          `Invalid @index '${name}'. You may not create an index where the partition key `
            + 'is the same as that of the primary key unless the index has a sort field. '
            + 'You cannot have a local secondary index without a sort key in the index.',
        );
      }
    }
  }

  const enums = ctx.output.getTypeDefinitionsOfKind(Kind.ENUM_TYPE_DEFINITION) as EnumTypeDefinitionNode[];

  if (!isScalarOrEnum(field.type, enums) || isListType(field.type)) {
    throw new InvalidDirectiveError(`Index '${name}' on type '${object.name.value}.${field.name.value}' cannot be a non-scalar.`);
  }

  for (const sortKeyFieldName of sortKeyFields) {
    const sortField = fieldMap.get(sortKeyFieldName);

    if (!sortField) {
      throw new InvalidDirectiveError(
        `Can't find field '${sortKeyFieldName}' in ${object.name.value}, but it was specified in index '${name}'.`,
      );
    }

    if (!isScalarOrEnum(sortField.type, enums) || isListType(sortField.type)) {
      throw new InvalidDirectiveError(
        `The sort key of index '${name}' on type '${object.name.value}.${sortField.name.value}' cannot be a non-scalar.`,
      );
    }

    config.sortKey.push(sortField);
  }
};
