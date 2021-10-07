import { TransformerPluginBase } from '@aws-amplify/graphql-transformer-core';
import { TransformerPluginType, TransformerSchemaVisitStepContextProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { ObjectTypeDefinitionNode, DirectiveNode } from 'graphql';
import { gql, InvalidDirectiveError } from 'graphql-transformer-core';

const directiveDefinition = gql`
  directive @was(name: String!) on OBJECT
`;

export class V2WasTransformer extends TransformerPluginBase {
  constructor() {
    super('amplify-was-transformer', directiveDefinition, TransformerPluginType.GENERIC);
  }

  object = (definition: ObjectTypeDefinitionNode, directive: DirectiveNode, ctx: TransformerSchemaVisitStepContextProvider) => {
    const modelName = definition.name.value;
    const prevNameNode = directive.arguments.find(arg => arg.name.value === 'name');
    if (!prevNameNode) {
      throw new InvalidDirectiveError('name is required in @was directive');
    }

    if (prevNameNode.value.kind !== 'StringValue') {
      throw new InvalidDirectiveError('a single string must be provided for "name" in @was directive');
    }

    const wasNamed = prevNameNode.value.value;
    ctx.resourceHelper.registerModelToTableNameMaping(modelName, wasNamed);
  };
}
