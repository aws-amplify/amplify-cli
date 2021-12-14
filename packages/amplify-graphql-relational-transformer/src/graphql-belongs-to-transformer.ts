import { createMutationMapping, createPostDataLoadMapping, createReadFieldInitMapping } from '@aws-amplify/graphql-maps-to-transformer';
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
import { ensureBelongsToConnectionField } from './schema';
import { BelongsToDirectiveConfiguration } from './types';
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

const directiveName = 'belongsTo';
const directiveDefinition = `
  directive @${directiveName}(fields: [String!]) on FIELD_DEFINITION
`;

export class BelongsToTransformer extends TransformerPluginBase {
  private directiveList: BelongsToDirectiveConfiguration[] = [];

  constructor() {
    super('amplify-belongs-to-transformer', directiveDefinition);
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
    } as BelongsToDirectiveConfiguration);

    validate(args, context as TransformerContextProvider);
    this.directiveList.push(args);
  };

  transformSchema = (ctx: TransformerTransformSchemaStepContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      config.relatedTypeIndex = getRelatedTypeIndex(config, context);
      ensureBelongsToConnectionField(config, context);
    }
  };

  generateResolvers = (ctx: TransformerContextProvider): void => {
    const context = ctx as TransformerContextProvider;

    for (const config of this.directiveList) {
      makeGetItemConnectionWithKeyResolver(config, context);
      if (isThisTypeRenamed(config.object.name.value, context.resourceHelper) && config.relationType === 'hasOne') {
        makeForeignKeyMappingResolvers(
          context.resolvers,
          context.resourceHelper,
          config.object.name.value,
          config.field.name.value,
          config.relatedType.name.value,
          config.relatedField.name.value,
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
  relatedTypeName: string,
  relatedFieldName: string,
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
  createReadFieldInitMapping({
    resolver: fieldResolver,
    resolverTypeName: thisTypeName,
    resolverFieldName: thisFieldName,
    currAttrName,
    origAttrName,
  });

  if (isThisTypeRenamed(relatedTypeName, resourceHelper)) {
    const relatedTypeCurrAttrName = getConnectionAttributeName(relatedTypeName, relatedFieldName);
    const relatedTypeOrigAttrName = getConnectionAttributeName(resourceHelper.getModelNameMapping(relatedTypeName), relatedFieldName);
    createPostDataLoadMapping({
      resolver: fieldResolver,
      resolverTypeName: thisTypeName,
      resolverFieldName: thisFieldName,
      currAttrName: relatedTypeCurrAttrName,
      origAttrName: relatedTypeOrigAttrName,
      isList: false,
    });
  }
}

function validate(config: BelongsToDirectiveConfiguration, ctx: TransformerContextProvider): void {
  const { field, object } = config;

  ensureFieldsArray(config);
  validateModelDirective(config);

  if (isListType(field.type)) {
    throw new InvalidDirectiveError(`@${directiveName} cannot be used with lists.`);
  }

  config.fieldNodes = getFieldsNodes(config, ctx);
  config.relatedType = getRelatedType(config, ctx);
  config.connectionFields = [];
  validateRelatedModelDirective(config);

  const isBidiRelation = config.relatedType.fields!.some(relatedField => {
    if (getBaseType(relatedField.type) !== object.name.value) {
      return false;
    }

    return relatedField.directives!.some(relatedDirective => {
      if (relatedDirective.name.value === 'hasOne' || relatedDirective.name.value === 'hasMany') {
        config.relatedField = relatedField;
        config.relationType = relatedDirective.name.value;
        return true;
      }
      return false;
    });
  });

  if (!isBidiRelation) {
    throw new InvalidDirectiveError(
      `${config.relatedType.name.value} must have a relationship with ${object.name.value} in order to use @${directiveName}.`,
    );
  }
}
