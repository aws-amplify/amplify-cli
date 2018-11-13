import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transformer-core'
import { ResourceConstants } from 'graphql-transformer-common'
import { AppSyncTransformer } from '../AppSyncTransformer'

import fs = require('fs');
import path = require('path');

test('Test AppSyncTransformer validation happy case', () => {
    const validSchema = `
    type Post {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const directory = './fileTest';
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(directory + '//')

        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    expect(out.Parameters.env).toBeTruthy()
    expect(out.Conditions.HasEnvironmentParameter).toBeTruthy()

    expect(fs.existsSync('./fileTest/schema.graphql')).toBeTruthy()

    cleanUpFiles(directory)
});

function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
        expect(foundField).toBeDefined()
    }
}

function doNotExpectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        expect(
            type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
        ).toBeUndefined()
    }
}

function getObjectType(doc: DocumentNode, type: string): ObjectTypeDefinitionNode | undefined {
    return doc.definitions.find(
        (def: DefinitionNode) => def.kind === Kind.OBJECT_TYPE_DEFINITION && def.name.value === type
    ) as ObjectTypeDefinitionNode | undefined
}

function getInputType(doc: DocumentNode, type: string): InputObjectTypeDefinitionNode | undefined {
    return doc.definitions.find(
        (def: DefinitionNode) => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type
    ) as InputObjectTypeDefinitionNode | undefined
}

function verifyInputCount(doc: DocumentNode, type: string, count: number): boolean {
    return doc.definitions.filter(def => def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION && def.name.value === type).length == count;
}

function cleanUpFiles(directory: string) {
    var files = fs.readdirSync(directory)
    for (const file of files) {
        const dir = path.join(directory, file)
        if (!fs.lstatSync(dir).isDirectory()) {
            fs.unlinkSync(dir)
        } else {
            cleanUpFiles(dir)
        }
    }
    fs.rmdirSync(directory)
}

function readFile(filePath: string) {
    return fs.readFileSync(filePath, "utf8")
}