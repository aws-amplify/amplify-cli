import { TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import { TransformerPluginType, TransformerSchemaVisitStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { ObjectTypeDefinitionNode, DirectiveNode } from 'graphql';
import { InvalidDirectiveError } from 'graphql-transformer-core';

const directiveName = 'original';

const directiveDefinition = `
  directive @${directiveName}(name: String!) on OBJECT
`;

export class OriginalTransformer extends TransformerPluginBase {
  constructor() {
    super(`amplify-${directiveName}-transformer`, directiveDefinition, TransformerPluginType.GENERIC);
  }

  object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider) => {
    const modelName = definition.name.value;
    const prevNameNode = directive.arguments.find(arg => arg.name.value === 'name');
    if (!prevNameNode) {
      throw new InvalidDirectiveError(`name is required in @${directiveName} directive`);
    }

    if (prevNameNode.value.kind !== 'StringValue') {
      throw new InvalidDirectiveError(`A single string must be provided for "name" in @${directiveName} directive`);
    }

    const originalName = prevNameNode.value.value;
    ctx.resourceHelper.registerModelToTableNameMaping(modelName, originalName);
  };
}
