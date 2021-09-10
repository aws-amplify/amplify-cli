import { DirectiveNode, FieldDefinitionNode, ObjectTypeDefinitionNode } from 'graphql';

export type HasOneDirectiveConfiguration = {
  directiveName: string;
  object: ObjectTypeDefinitionNode;
  field: FieldDefinitionNode;
  directive: DirectiveNode;
  fields: string[];
  fieldNodes: FieldDefinitionNode[];
  relatedType: ObjectTypeDefinitionNode;
  relatedTypeIndex: FieldDefinitionNode[];
  connectionFields: string[];
};

export type HasManyDirectiveConfiguration = {
  directiveName: string;
  object: ObjectTypeDefinitionNode;
  field: FieldDefinitionNode;
  directive: DirectiveNode;
  indexName: string;
  fields: string[];
  fieldNodes: FieldDefinitionNode[];
  relatedType: ObjectTypeDefinitionNode;
  relatedTypeIndex: FieldDefinitionNode[];
  connectionFields: string[];
  limit: number;
};

export type BelongsToDirectiveConfiguration = {
  directiveName: string;
  object: ObjectTypeDefinitionNode;
  field: FieldDefinitionNode;
  directive: DirectiveNode;
  fields: string[];
  fieldNodes: FieldDefinitionNode[];
  relatedType: ObjectTypeDefinitionNode;
  relatedTypeIndex: FieldDefinitionNode[];
  connectionFields: string[];
};

export type ManyToManyDirectiveConfiguration = {
  directiveName: string;
  object: ObjectTypeDefinitionNode;
  field: FieldDefinitionNode;
  directive: DirectiveNode;
  relationName: string;
  indexName: string;
  fields: string[];
  fieldNodes: FieldDefinitionNode[];
  relatedType: ObjectTypeDefinitionNode;
  relatedTypeIndex: FieldDefinitionNode[];
  connectionFields: string[];
  limit: number;
};

export type ManyToManyRelation = {
  name: string;
  directive1: ManyToManyDirectiveConfiguration;
  directive2: ManyToManyDirectiveConfiguration;
};
