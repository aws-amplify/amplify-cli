import { DirectiveWrapper, InvalidDirectiveError, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerPrepareStepContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { getBaseType, isListType, isNonNullType, makeField, makeNamedType, makeNonNullType } from 'graphql-transformer-common';
import {
  DirectiveNode,
  DocumentNode,
  FieldDefinitionNode,
  InterfaceTypeDefinitionNode,
  NamedTypeNode,
  ObjectTypeDefinitionNode,
} from 'graphql';
import { makeQueryConnectionWithKeyResolver, updateTableForConnection } from './resolvers';
import { ensureHasManyConnectionField, extendTypeWithConnection } from './schema';
import { HasManyDirectiveConfiguration } from './types';
import {
  ensureFieldsArray, getConnectionAttributeName,
  getFieldsNodes,
  getRelatedType,
  getRelatedTypeIndex,
  registerHasManyForeignKeyMappings,
  validateDisallowedDataStoreRelationships,
  validateModelDirective,
  validateRelatedModelDirective,
} from './utils';
import { TransformerPreProcessContextProvider } from '@aws-amplify/graphql-transformer-interfaces/lib/transformer-context/transformer-context-provider';
import produce from 'immer';
import { Field } from '@aws-cdk/aws-appsync';
import { WritableDraft } from 'immer/dist/types/types-external';

const directiveName = 'hasMany';
const defaultLimit = 100;
const directiveDefinition = `
  directive @${directiveName}(indexName: String, fields: [String!], limit: Int = ${defaultLimit}) on FIELD_DEFINITION
`;

export class HasManyTransformer extends TransformerPluginBase {
  private directiveList: HasManyDirectiveConfiguration[] = [];

  constructor() {
    super('amplify-has-many-transformer', directiveDefinition);
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
      limit: defaultLimit,
    } as HasManyDirectiveConfiguration);

    validate(args, context as TransformerContextProvider);
    this.directiveList.push(args);
  };

  /** During the preProcess step, modify the document node and return it
   * so that it represents any schema modifications the plugin needs
   */
  preProcess = (context: TransformerPreProcessContextProvider): DocumentNode => {
    const resultDoc: DocumentNode = produce(context.inputDocument, draftDoc => {
      const connectingFieldsMap = new Map<string, WritableDraft<FieldDefinitionNode>>(); // key: type name | value: connecting field
      // First iteration builds a map of the hasMany connecting fields that need to exist, second iteration ensures they exist
      draftDoc?.definitions?.forEach(def => {
        if (def.kind === 'ObjectTypeExtension' || def.kind === 'ObjectTypeDefinition') {
          def?.fields?.forEach(field => {
            field?.directives?.forEach(dir => {
              if (dir.name.value === directiveName) {
                const baseFieldType = getBaseType(field.type);
                const connectionAttributeName = getConnectionAttributeName(def.name.value, field.name.value);
                const newField = makeField(connectionAttributeName, [], isNonNullType(field.type) ? makeNonNullType(makeNamedType('ID')) : makeNamedType('ID'), []);
                connectingFieldsMap.set(baseFieldType, newField as WritableDraft<FieldDefinitionNode>);
              }
            });
          });
        }
      });

      draftDoc?.definitions?.forEach(def => {
        if ((def.kind === 'ObjectTypeDefinition' || def.kind === 'ObjectTypeExtension') && connectingFieldsMap.has(def.name.value)) {
          const fieldToAdd = connectingFieldsMap.get(def.name.value);
          if (def.fields && fieldToAdd && !def.fields.some(field => field.name.value === fieldToAdd.name.value)) {
            def.fields.push(fieldToAdd);
          }
        }
      });
    });
    return resultDoc;
  }

  /**
   * During the prepare step, register any foreign keys that are renamed due to a model rename
   */
  prepare = (context: TransformerPrepareStepContextProvider): void => {
    this.directiveList.forEach(config => {
      registerHasManyForeignKeyMappings({
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
      config.relatedTypeIndex = getRelatedTypeIndex(config, context, config.indexName);
      ensureHasManyConnectionField(config, context);
      extendTypeWithConnection(config, context);
    }
  };

  generateResolvers = (ctx: TransformerContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      updateTableForConnection(config, context);
      makeQueryConnectionWithKeyResolver(config, context);
    }
  };
}

function validate(config: HasManyDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { field } = config;

  ensureFieldsArray(config);
  validateModelDirective(config);

  if (!isListType(field.type)) {
    throw new InvalidDirectiveError(`@${directiveName} must be used with a list. Use @hasOne for non-list types.`);
  }

  config.fieldNodes = getFieldsNodes(config, ctx);
  config.relatedType = getRelatedType(config, ctx);
  config.connectionFields = [];
  validateRelatedModelDirective(config);
  validateDisallowedDataStoreRelationships(config, ctx);
}
