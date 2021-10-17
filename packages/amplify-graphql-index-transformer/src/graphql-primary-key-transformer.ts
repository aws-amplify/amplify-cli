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
import { isNonNullType, isScalarOrEnum } from 'graphql-transformer-common';
import { constructSyncVTL, replaceDdbPrimaryKey, updateResolvers } from './resolvers';
import {
  addKeyConditionInputs,
  removeAutoCreatedPrimaryKey,
  updateGetField,
  updateInputObjects,
  updateListField,
  updateMutationConditionInput,
} from './schema';
import { PrimaryKeyDirectiveConfiguration } from './types';

const directiveName = 'primaryKey';
const directiveDefinition = `
  directive @${directiveName}(sortKeyFields: [String]) on FIELD_DEFINITION
`;

export class PrimaryKeyTransformer extends TransformerPluginBase {
  private directiveList: PrimaryKeyDirectiveConfiguration[] = [];
  private resolverMap: Map<TransformerResolverProvider, string> = new Map();

  constructor() {
    super('amplify-primary-key-transformer', directiveDefinition);
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
    } as PrimaryKeyDirectiveConfiguration);

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
      updateGetField(config, context);
      updateListField(config, context);
      updateInputObjects(config, context);
      removeAutoCreatedPrimaryKey(config, context);
      addKeyConditionInputs(config, context);
      updateMutationConditionInput(config, context);
    }
  };

  generateResolvers = (ctx: TransformerContextProvider): void => {
    for (const config of this.directiveList) {
      replaceDdbPrimaryKey(config, ctx);
      updateResolvers(config, ctx, this.resolverMap);
    }
  };
}

function validate(config: PrimaryKeyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { object, field, sortKeyFields } = config;
  const modelDirective = object.directives!.find(directive => {
    return directive.name.value === 'model';
  });

  if (!modelDirective) {
    throw new InvalidDirectiveError(`The @${directiveName} directive may only be added to object definitions annotated with @model.`);
  }

  config.modelDirective = modelDirective;

  const fieldMap = new Map<string, FieldDefinitionNode>();

  for (const objectField of object.fields!) {
    fieldMap.set(objectField.name.value, objectField);

    if (field === objectField) {
      continue;
    }

    for (const directive of objectField.directives!) {
      if (directive.name.value === directiveName) {
        throw new InvalidDirectiveError(`You may only supply one primary key on type '${object.name.value}'.`);
      }
    }
  }

  if (!isNonNullType(field.type)) {
    throw new InvalidDirectiveError(`The primary key on type '${object.name.value}' must reference non-null fields.`);
  }

  const enums = ctx.output.getTypeDefinitionsOfKind(Kind.ENUM_TYPE_DEFINITION) as EnumTypeDefinitionNode[];

  if (!isScalarOrEnum(field.type, enums)) {
    throw new InvalidDirectiveError(`The primary key on type '${object.name.value}.${field.name.value}' cannot be a non-scalar.`);
  }

  for (const sortKeyFieldName of sortKeyFields) {
    const sortField = fieldMap.get(sortKeyFieldName);

    if (!sortField) {
      throw new InvalidDirectiveError(
        `Can't find field '${sortKeyFieldName}' in ${object.name.value}, but it was specified in the primary key.`,
      );
    }

    if (!isScalarOrEnum(sortField.type, enums)) {
      throw new InvalidDirectiveError(
        `The primary key's sort key on type '${object.name.value}.${sortField.name.value}' cannot be a non-scalar.`,
      );
    }

    config.sortKey.push(sortField);
  }
}
