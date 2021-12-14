import { createMutationMapping, createPostDataLoadMapping } from '@aws-amplify/graphql-maps-to-transformer';
import { DirectiveWrapper, getFieldNameFor, InvalidDirectiveError, TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerResolversManagerProvider,
  TransformerResourceHelperProvider,
  TransformerSchemaVisitStepContextProvider,
  TransformerTransformSchemaStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { DirectiveNode, FieldDefinitionNode, InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';
import { getBaseType, isListType } from 'graphql-transformer-common';
import { makeGetItemConnectionWithKeyResolver } from './resolvers';
import { ensureHasOneConnectionField } from './schema';
import { HasOneDirectiveConfiguration } from './types';
import {
  ensureFieldsArray,
  getConnectionAttributeName,
  getFieldsNodes,
  getRelatedType,
  getRelatedTypeIndex,
  isThisTypeRenamed,
  validateModelDirective,
  validateRelatedModelDirective,
} from './utils';

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
      // if this type has been renamed
      if (isThisTypeRenamed(config.object.name.value, context.resourceHelper)) {
        makeForeignKeyMappingResolvers(
          context.resolvers,
          context.resourceHelper,
          config.object.name.value,
          config.field.name.value,
          config.relatedType,
        );
      }
    }
  };
}

function makeForeignKeyMappingResolvers(
  resolvers: TransformerResolversManagerProvider,
  resourceHelper: TransformerResourceHelperProvider,
  thisTypeName: string,
  thisFieldName: string,
  relatedType: ObjectTypeDefinitionNode,
) {
  const currAttrName = getConnectionAttributeName(thisTypeName, thisFieldName);
  const origAttrName = getConnectionAttributeName(resourceHelper.getModelNameMapping(thisTypeName), thisFieldName);
  (['create', 'update'] as const).forEach(op => {
    const mutationFieldName = getFieldNameFor(op, thisTypeName);
    const mutationResolver = resolvers.getResolver('Mutation', mutationFieldName);
    if (!mutationResolver) {
      return;
    }
    createMutationMapping({ mutationResolver, mutationFieldName, currAttrName, origAttrName });
  });

  (['get', 'list'] as const).forEach(op => {
    const resolverFieldName = getFieldNameFor(op, thisTypeName);
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
  const relatedTypeName = relatedType.name.value;
  const relatedHasOneField = biDiHasOneField(relatedType, thisTypeName);
  if (isThisTypeRenamed(relatedTypeName, resourceHelper) && relatedHasOneField !== undefined) {
    const relatedCurrAttrName = getConnectionAttributeName(relatedTypeName, relatedHasOneField);
    const relatedOrigAttrName = getConnectionAttributeName(resourceHelper.getModelNameMapping(relatedTypeName), relatedHasOneField);
    createPostDataLoadMapping({
      resolver: fieldResolver,
      resolverTypeName: thisTypeName,
      resolverFieldName: thisFieldName,
      currAttrName: relatedCurrAttrName,
      origAttrName: relatedOrigAttrName,
      isList: false,
    });
  }
}

function biDiHasOneField(relatedType: ObjectTypeDefinitionNode, thisTypeName: string): undefined | string {
  return relatedType.fields?.find(
    field =>
      getBaseType(field.type) === thisTypeName &&
      field.directives?.find(directive => directive.name.value === 'hasOne' || directive.name.value === 'belongsTo'),
  )?.name.value;
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
}
