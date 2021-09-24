import { ObjectTypeDefinitionNode, FieldDefinitionNode, DocumentNode, Kind } from 'graphql';

export const getObjectType = (doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined => {
  return doc.definitions.find(def => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;
};
export const getField = (obj: ObjectTypeDefinitionNode, fieldName: string): FieldDefinitionNode | void => {
  return obj.fields?.find(f => f.name.value === fieldName);
};
