import { DirectiveNode, FieldDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';

export type PrimaryKeyDirectiveConfiguration = {
  object: ObjectTypeDefinitionNode;
  field: FieldDefinitionNode;
  directive: DirectiveNode;
  sortKeyFields: string[];
  sortKey: FieldDefinitionNode[];
  modelDirective: DirectiveNode;
};

export type IndexDirectiveConfiguration = PrimaryKeyDirectiveConfiguration & {
  name: string;
  queryField: string;
  primaryKeyField: FieldDefinitionNode;
};
