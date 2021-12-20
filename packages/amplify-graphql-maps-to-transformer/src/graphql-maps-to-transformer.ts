import { TransformerPluginBase, InvalidDirectiveError } from '@aws-amplify/graphql-transformer-core';
import {
  TransformerContextProvider,
  TransformerPluginType,
  TransformerSchemaVisitStepContextProvider,
} from '@aws-amplify/graphql-transformer-interfaces';
import { ObjectTypeDefinitionNode, DirectiveNode } from 'graphql';
import { attachInputMappingSlot, attachResponseMappingSlot } from './field-mapping-resolvers';

const directiveName = 'mapsTo';

const directiveDefinition = `
  directive @${directiveName}(name: String!) on OBJECT
`;

export class MapsToTransformer extends TransformerPluginBase {
  constructor() {
    super(`amplify-maps-to-transformer`, directiveDefinition, TransformerPluginType.GENERIC);
  }

  object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider) => {
    const modelName = definition.name.value;
    const prevNameNode = directive.arguments?.find(arg => arg.name.value === 'name');
    if (!prevNameNode) {
      throw new InvalidDirectiveError(`name is required in @${directiveName} directive`);
    }

    if (prevNameNode.value.kind !== 'StringValue') {
      throw new InvalidDirectiveError(`A single string must be provided for "name" in @${directiveName} directive`);
    }

    const originalName = prevNameNode.value.value;
    ctx.resourceHelper.setModelNameMapping(modelName, originalName);
  };

  generateResolvers = (context: TransformerContextProvider) => {
    context.resourceHelper.getModelFieldMapKeys().forEach(modelName => {
      const modelFieldMap = context.resourceHelper.getModelFieldMap(modelName);
      if (!modelFieldMap.getMappedFields().length) {
        return;
      }
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
          attachResponseMappingSlot({
            slotName: 'postUpdate',
            resolver,
            resolverTypeName: typeName,
            resolverFieldName: fieldName,
            fieldMap: modelFieldMap.getMappedFields(),
            isList: false,
          });
          return;
        }
        attachResponseMappingSlot({
          slotName: 'postDataLoad',
          resolver,
          resolverTypeName: typeName,
          resolverFieldName: fieldName,
          fieldMap: modelFieldMap.getMappedFields(),
          isList,
        });
      });
    });
  };
}
