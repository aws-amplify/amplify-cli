import {
    ObjectTypeDefinitionNode, FieldDefinitionNode, DocumentNode,
    InputObjectTypeDefinitionNode, Kind, InputValueDefinitionNode,
    DefinitionNode
} from 'graphql';
import { isNonNullType } from 'graphql-transformer-common';

export function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
        expect(foundField).toBeDefined()
    }
}

export function expectNonNullFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
        expect(foundField).toBeDefined()
        expect(isNonNullType(foundField.type)).toBeTruthy();
    }
}

export function expectNullableFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
        expect(foundField).toBeDefined()
        expect(isNonNullType(foundField.type)).toBeFalsy();
    }
}

export function expectArguments(field: FieldDefinitionNode, args: string[]) {
    for (const argName of args) {
        const foundArg = field.arguments.find((a: InputValueDefinitionNode) => a.name.value === argName)
        expect(foundArg).toBeDefined()
    }
}

export function doNotExpectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        expect(
            type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
        ).toBeUndefined()
    }
}

export function getObjectType(doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined {
    return doc.definitions.find(
        (def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type
    ) as ObjectTypeDefinitionNode | undefined
}

export function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
    return doc.definitions.find(
        (def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type
    ) as InputObjectTypeDefinitionNode | undefined
}

export function expectInputValues(type: InputObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        const foundField = type.fields.find((f: InputValueDefinitionNode) => f.name.value === fieldName)
        expect(foundField).toBeDefined()
    }
}

export function expectInputValueToHandle(type: InputObjectTypeDefinitionNode, f: (input: InputValueDefinitionNode) => boolean) {
    for (const field of type.fields) {
        expect(f(field)).toBeTruthy()
    }
}

export function expectNonNullInputValues(type: InputObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        const foundField = type.fields.find((f: InputValueDefinitionNode) => f.name.value === fieldName)
        expect(foundField).toBeDefined()
        expect(isNonNullType(foundField.type)).toBeTruthy();
    }
}

export function expectNullableInputValues(type: InputObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        const foundField = type.fields.find((f: InputValueDefinitionNode) => f.name.value === fieldName)
        expect(foundField).toBeDefined()
        expect(isNonNullType(foundField.type)).toBeFalsy();
    }
}

export function expectExactKeys(obj: Object, expectedSet: Set<string>) {
    const resourceSet = new Set(Object.keys(obj));
    expectedSet.forEach(item => {
        expect(resourceSet.has(item)).toBeTruthy();
    })
    expect(resourceSet.size).toEqual(expectedSet.size);
}