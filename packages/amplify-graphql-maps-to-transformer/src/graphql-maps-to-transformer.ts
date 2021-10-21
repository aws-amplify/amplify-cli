import { TransformerPluginBase, InvalidDirectiveError } from '@aws-amplify/graphql-transformer-core';
import { TransformerPluginType, TransformerSchemaVisitStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { ObjectTypeDefinitionNode, DirectiveNode } from 'graphql';

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
    ctx.resourceHelper.registerModelToTableNameMapping(modelName, originalName);
  };
}
