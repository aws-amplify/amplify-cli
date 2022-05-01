import { DirectiveWrapper, InvalidDirectiveError, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerPrepareStepContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import {
  ArgumentNode,
  DirectiveNode,
  DocumentNode,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
} from 'graphql';
import {
  isListType,
  isNonNullType,
  makeArgument,
  makeField,
  makeNamedType,
  makeNonNullType,
  makeValueNode,
} from 'graphql-transformer-common';
import { produce } from 'immer';
import { makeGetItemConnectionWithKeyResolver } from './resolvers';
import { ensureHasOneConnectionField } from './schema';
import { HasOneDirectiveConfiguration } from './types';
import {
  ensureFieldsArray, getConnectionAttributeName,
  getFieldsNodes,
  getRelatedType,
  getRelatedTypeIndex,
  registerHasOneForeignKeyMappings,
  validateDisallowedDataStoreRelationships,
  validateModelDirective,
  validateRelatedModelDirective,
} from './utils';
import { TransformerPreProcessContextProvider } from '@aws-amplify/graphql-transformer-interfaces/lib/transformer-context/transformer-context-provider';
import { WritableDraft } from 'immer/dist/types/types-external';

const directiveName = 'hasOne';
const directiveDefinition = `
  directive @${directiveName}(fields: [String!]) on FIELD_DEFINITION
`;

export class HasOneTransformer extends TransformerPluginBase {
  private directiveList: HasOneDirectiveConfiguration[] = [];

  constructor() {
    super('amplify-has-one-transformer', directiveDefinition);
  }

  field = (
    parent: ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode,
    definition: FieldDefinitionNode,
    directive: DirectiveNode,
    context: TransformerSchemaVisitStepContextProvider,
  ): void => {
    const directiveWrapped = new DirectiveWrapper(directive);
    const args = directiveWrapped.getArguments({
      directiveName,
      object: parent as ObjectTypeDefinitionNode,
      field: definition,
      directive,
    } as HasOneDirectiveConfiguration);

    validate(args, context as TransformerContextProvider);
    this.directiveList.push(args);
  };

  /** During the preProcess step, modify the document node and return it
   * so that it represents any schema modifications the plugin needs
   */
  preProcess = (context: TransformerPreProcessContextProvider): DocumentNode => {
    const document = produce(context.inputDocument, draftDoc => {
      draftDoc.definitions.forEach(def => {
        if (def.kind === 'ObjectTypeDefinition' || def.kind === 'ObjectTypeExtension') {
          def?.fields?.forEach(field => {
            field?.directives?.forEach(dir => {
              if (dir.name.value === directiveName) {
                const connectionAttributeName = getConnectionAttributeName(def.name.value, field.name.value);
                let hasFieldsDefined = false;
                let removalIndex = -1;
                dir?.arguments?.forEach((arg, idx) => {
                  if (arg.name.value === 'fields') {
                    if ((arg.value.kind === 'StringValue' && arg.value.value) || (arg.value.kind === 'ListValue' && arg.value.values && arg.value.values.length > 0)) {
                      hasFieldsDefined = true;
                    } else {
                      removalIndex = idx;
                    }
                  }
                });
                if (removalIndex !== -1) {
                  dir?.arguments?.splice(removalIndex, 1);
                }
                if (!hasFieldsDefined) {
                  dir.arguments = [makeArgument('fields', makeValueNode(connectionAttributeName)) as WritableDraft<ArgumentNode>];
                  def?.fields?.push(
                    makeField(
                      connectionAttributeName, [], isNonNullType(field.type) ?
                        makeNonNullType(makeNamedType('ID')) : makeNamedType('ID'), [],
                    ) as WritableDraft<FieldDefinitionNode>,
                  );
                }
              }
            });
          });
        }
      });
    });
    return document;
  }

  /**
   * During the prepare step, register any foreign keys that are renamed due to a model rename
   */
  prepare = (context: TransformerPrepareStepContextProvider) => {
    this.directiveList.forEach(config => {
      registerHasOneForeignKeyMappings({
        resourceHelper: context.resourceHelper,
        thisTypeName: config.object.name.value,
        thisFieldName: config.field.name.value,
        relatedTypeName: config.relatedType.name.value,
      });
    });
  };

  transformSchema = (ctx: TransformerTransformSchemaStepContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      config.relatedTypeIndex = getRelatedTypeIndex(config, context);
      ensureHasOneConnectionField(config, context);
    }
  };

  generateResolvers = (ctx: TransformerContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      makeGetItemConnectionWithKeyResolver(config, context);
    }
  };
}

function validate(config: HasOneDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { field } = config;

  ensureFieldsArray(config);
  validateModelDirective(config);

  if (isListType(field.type)) {
    throw new InvalidDirectiveError(`@${directiveName} cannot be used with lists. Use @hasMany instead.`);
  }

  config.fieldNodes = getFieldsNodes(config, ctx);
  config.relatedType = getRelatedType(config, ctx);
  config.connectionFields = [];
  validateRelatedModelDirective(config);
  validateDisallowedDataStoreRelationships(config, ctx);
}
