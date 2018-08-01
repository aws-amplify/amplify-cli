import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transform'
import { ResourceConstants } from 'graphql-transformer-common'
import { AppSyncDynamoDBTransformer } from 'graphql-dynamodb-transformer'
import { AppSyncSearchableTransformer } from 'graphql-elasticsearch-transformer'
import { AppSyncTransformer } from '../AppSyncTransformer'

import fs = require('fs');
import path = require('path');

test('Test AppSyncTransformer validation happy case', () => {
    const validSchema = `
    type Post @model @searchable {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }
    `
    const directory = './fileTest';
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(directory + '//'),
            new AppSyncDynamoDBTransformer(),
            new AppSyncSearchableTransformer()

        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()

    expect(fs.existsSync('./fileTest/schema.graphql')).toBeTruthy
    expect(fs.existsSync('./fileTest/resolver/Mutation.createPost.request')).toBeTruthy
    expect(fs.existsSync('./fileTest/resolver/Mutation.createPost.response')).toBeTruthy
    expect(fs.existsSync('./fileTest/resolver/Query.getPost.request')).toBeTruthy
    expect(fs.existsSync('./fileTest/resolver/Query.getPost.request')).toBeTruthy
    expect(fs.existsSync('./fileTest/function/python_streaming_function.py')).toBeTruthy

    cleanUpFiles(directory)
});

test('Test AppSyncTransformer with multiple model directives', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
    }

    type User @model {
        id: ID!
        name: String!
    }
    `

    const directory = './fileTestTwo'
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(directory),
            new AppSyncDynamoDBTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()

    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definitionS3Location = schema.Properties.DefinitionS3Location
    expect(definitionS3Location).toBeDefined()

    const schemaDefinition = readFile(directory + '/schema.graphql')
    expect(schemaDefinition).toBeDefined()

    const parsed = parse(schemaDefinition);
    const queryType = getObjectType(parsed, 'Query')
    expect(queryType).toBeDefined()
    expectFields(queryType, ['listPost'])
    // expectFields(queryType, ['queryPost'])
    expectFields(queryType, ['listUser'])
    // expectFields(queryType, ['queryUser'])

    expect(verifyInputCount(parsed, 'TableStringFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableBooleanFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIntFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableFloatFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableIDFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TablePostFilterInput', 1)).toBeTruthy;
    expect(verifyInputCount(parsed, 'TableUserFilterInput', 1)).toBeTruthy;

    expect(fs.existsSync('./fileTestTwo/schema.graphql')).toBeTruthy
    expect(fs.existsSync('./fileTestTwo/resolver/Mutation.createPost.request')).toBeTruthy
    expect(fs.existsSync('./fileTestTwo/resolver/Mutation.createPost.response')).toBeTruthy
    expect(fs.existsSync('./fileTestTwo/resolver/Mutation.createUser.request')).toBeTruthy
    expect(fs.existsSync('./fileTestTwo/resolver/Mutation.createUser.response')).toBeTruthy
    expect(fs.existsSync('./fileTestTwo/resolver/Query.getPost.request')).toBeTruthy
    expect(fs.existsSync('./fileTestTwo/resolver/Query.getPost.request')).toBeTruthy

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