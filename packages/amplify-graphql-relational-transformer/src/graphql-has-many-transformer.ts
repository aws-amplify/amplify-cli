import { DirectiveWrapper, InvalidDirectiveError, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { isListType } from 'graphql-transformer-common';
import { DirectiveNode, FieldDefinitionNode, InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { makeQueryConnectionWithKeyResolver, updateTableForConnection } from './resolvers';
import { ensureHasManyConnectionField, extendTypeWithConnection } from './schema';
import { HasManyDirectiveConfiguration } from './types';
import {
  ensureFieldsArray,
  getFieldsNodes,
  getRelatedType,
  getRelatedTypeIndex,
  validateDisallowedDataStoreRelationships,
  validateModelDirective,
  validateRelatedModelDirective,
} from './utils';

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
