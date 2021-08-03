import {
  DefinitionNode,
  DocumentNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputValueDefinitionNode,
  Kind,
  ObjectTypeDefinitionNode,
  parse,
  TypeNode,
} from 'graphql';

export function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | InputObjectTypeDefinitionNode
    | undefined;
}

export function expectFieldsOnInputType(type: InputObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    const foundField = type.fields!.find((f: InputValueDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeDefined();
  }
}

export function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    const foundField = type.fields!.find((f: FieldDefinitionNode) => f.name.value === fieldName);
    expect(foundField).toBeDefined();
  }
}

export function getObjectType(doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined {
  return doc.definitions.find((def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type) as
    | ObjectTypeDefinitionNode
    | undefined;
}

export function doNotExpectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
  for (const fieldName of fields) {
    expect(type.fields!.find((f: FieldDefinitionNode) => f.name.value === fieldName)).toBeUndefined();
  }
}

export function verifyInputCount(doc: DocumentNode, type: string, count: number): boolean {
  return doc.definitions.filter(def => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type).length == count;
}

export function getFieldOnInputType(type: InputObjectTypeDefinitionNode, field: string): InputValueDefinitionNode {
  return type.fields!.find((f: InputValueDefinitionNode) => f.name.value === field)!;
}

export function getFieldOnObjectType(type: ObjectTypeDefinitionNode, field: string): FieldDefinitionNode {
  return type.fields!.find((f: FieldDefinitionNode) => f.name.value === field)!;
}

export function verifyMatchingTypes(t1: TypeNode, t2: TypeNode): boolean {
  if (t1.kind !== t2.kind) {
    return false;
  }

  if (t1.kind !== Kind.NAMED_TYPE && t2.kind !== Kind.NAMED_TYPE) {
    return verifyMatchingTypes(t1.type, t2.type);
  } else {
    return false;
  }
}
