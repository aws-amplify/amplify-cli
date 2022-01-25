import { TransformerPluginBase, InvalidDirectiveError } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerPluginType,
  TransformerSchemaVisitStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { ObjectTypeDefinitionNode, DirectiveNode, Kind, DefinitionNode } from 'graphql';
import { createMappingLambda } from './field-mapping-lambda';
import { attachFilterAndConditionInputMappingSlot, attachInputMappingSlot, attachResponseMappingSlot } from './field-mapping-resolvers';

const directiveName = 'mapsTo';

const directiveDefinition = `
  directive @${directiveName}(name: String!) on OBJECT
`;

export class MapsToTransformer extends TransformerPluginBase {
  constructor() {
    super(`amplify-maps-to-transformer`, directiveDefinition, TransformerPluginType.GENERIC);
  }

  /**
   * During the AST tree walking, the mapsTo transformer registers any renamed models with the ctx.resourceHelper
   */
  object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider) => {
    const modelName = definition.name.value;
    const prevNameNode = directive.arguments?.find(arg => arg.name.value === 'name');

    const hasModelDirective = !!definition.directives?.find(directive => directive.name.value === 'model');
    if (!hasModelDirective) {
      throw new InvalidDirectiveError(`@mapsTo can only be used on an @model type`);
    }

    // the following checks should never fail because the graphql schema already validates them, but TS complains without them
    if (!prevNameNode) {
      throw new InvalidDirectiveError(`name is required in @${directiveName} directive`);
    }

    if (prevNameNode.value.kind !== 'StringValue') {
      throw new InvalidDirectiveError(`A single string must be provided for "name" in @${directiveName} directive`);
    }

    const originalName = prevNameNode.value.value;

    const schemaHasConflictingModel = !!ctx.inputDocument.definitions.find(hasModelWithNamePredicate(originalName));
    if (schemaHasConflictingModel) {
      throw new InvalidDirectiveError(`Type ${modelName} cannot map to ${originalName} because ${originalName} is a model in the schema.`);
    }
    ctx.resourceHelper.setModelNameMapping(modelName, originalName);
  };

  /**
   * During the generateResolvers step, the mapsTo transformer reads all of the model field mappings from the resourceHelper and generates
   * VTL to map the current field names to the original field names
   */
  after = (context: TransformerContextProvider) => {
    context.resourceHelper.getModelFieldMapKeys().forEach(modelName => {
      const modelFieldMap = context.resourceHelper.getModelFieldMap(modelName);
      if (!modelFieldMap.getMappedFields().length) {
        return;
      }
      const lambdaDataSource = createMappingLambda(context.api.host, context.stackManager);
      modelFieldMap.getResolverReferences().forEach(({ typeName, fieldName, isList }) => {
        const resolver = context.resolvers.getResolver(typeName, fieldName);
        if (!resolver) {
          return;
        }
        if (typeName === 'Mutation') {
          attachInputMappingSlot({
            resolver,
            resolverTypeName: typeName,
            resolverFieldName: fieldName,
            fieldMap: modelFieldMap.getMappedFields(),
          });
          attachFilterAndConditionInputMappingSlot({
            slotName: 'preUpdate',
            resolver,
            resolverTypeName: typeName,
            resolverFieldName: fieldName,
            fieldMap: modelFieldMap.getMappedFields(),
            dataSource: lambdaDataSource,
          });
          attachResponseMappingSlot({
            slotName: 'postUpdate',
            resolver,
            resolverTypeName: typeName,
            resolverFieldName: fieldName,
            fieldMap: modelFieldMap.getMappedFields(),
            isList: false,
          });
        } else {
          // typeName is Query
          attachFilterAndConditionInputMappingSlot({
            slotName: 'preDataLoad',
            resolver,
            resolverTypeName: typeName,
            resolverFieldName: fieldName,
            fieldMap: modelFieldMap.getMappedFields(),
            dataSource: lambdaDataSource,
          });
          attachResponseMappingSlot({
            slotName: 'postDataLoad',
            resolver,
            resolverTypeName: typeName,
            resolverFieldName: fieldName,
            fieldMap: modelFieldMap.getMappedFields(),
            isList,
          });
        }
      });
    });
  };
}

// returns a predicate for determining if a DefinitionNode is an model object with the given name
const hasModelWithNamePredicate = (name: string) => (node: DefinitionNode) =>
  node.kind === Kind.OBJECT_TYPE_DEFINITION && !!node.directives?.find(dir => dir.name.value === 'model') && node.name.value === name;
