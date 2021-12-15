import {
  DirectiveWrapper,
  InvalidDirectiveError,
  getFieldNameFor,
  MappingTemplate,
  TransformerPluginBase,
} from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerResolversManagerProvider,
  TransformerResourceHelperProvider,
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
  getConnectionAttributeName,
  getFieldsNodes,
  getRelatedType,
  getRelatedTypeIndex,
  isThisTypeRenamed,
  validateDisallowedDataStoreRelationships,
  validateModelDirective,
  validateRelatedModelDirective,
} from './utils';
import { createMutationMapping, createPostDataLoadMapping } from '@aws-amplify/graphql-maps-to-transformer';

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
      if (isThisTypeRenamed(config.object.name.value, context.resourceHelper)) {
        makeForeignKeyMappingResolvers(
          config.relatedType.name.value,
          context.resolvers,
          context.resourceHelper,
          config.object.name.value,
          config.field.name.value,
        );
      }
    }
  };
}

function makeForeignKeyMappingResolvers(
  relatedTypeName: string,
  resolvers: TransformerResolversManagerProvider,
  resourceHelper: TransformerResourceHelperProvider,
  thisTypeName: string,
  thisFieldName: string,
): void {
  const currAttrName = getConnectionAttributeName(thisTypeName, thisFieldName);
  const origAttrName = getConnectionAttributeName(resourceHelper.getModelNameMapping(thisTypeName), thisFieldName);

  (['create', 'update'] as const).forEach(op => {
    const mutationFieldName = getFieldNameFor(op, relatedTypeName);
    const mutationResolver = resolvers.getResolver('Mutation', mutationFieldName);
    if (!mutationResolver) {
      return;
    }
    createMutationMapping({ mutationResolver, mutationFieldName, origAttrName, currAttrName });
  });

  (['get', 'list'] as const).forEach(op => {
    const resolverFieldName = getFieldNameFor(op, relatedTypeName);
    const resolverTypeName = 'Query';
    const resolver = resolvers.getResolver(resolverTypeName, resolverFieldName);
    if (!resolver) {
      return;
    }
    createPostDataLoadMapping({ resolver, resolverTypeName, resolverFieldName, currAttrName, origAttrName, isList: op === 'list' });
  });

  const fieldResolver = resolvers.getResolver(thisTypeName, thisFieldName);
  if (!fieldResolver) {
    return;
  }
  createPostDataLoadMapping({
    resolver: fieldResolver,
    resolverTypeName: thisTypeName,
    resolverFieldName: thisFieldName,
    currAttrName,
    origAttrName,
    isList: true,
  });
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
