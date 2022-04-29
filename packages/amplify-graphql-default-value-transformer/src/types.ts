import { DirectiveNode, FieldDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';

export type DefaultValueDirectiveConfiguration = {
  object: ObjectTypeDefinitionNode;
  field: FieldDefinitionNode;
  directive: DirectiveNode;
  modelDirective: DirectiveNode;
  value: string;
};
