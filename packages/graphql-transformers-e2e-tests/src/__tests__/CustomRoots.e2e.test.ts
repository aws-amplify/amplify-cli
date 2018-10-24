import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transformer-core'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import { AppSyncTransformer } from 'graphql-appsync-transformer'
import { ResourceConstants } from 'graphql-transformer-common';

import fs = require('fs');
import path = require('path');

jest.setTimeout(2000000);

test('Test custom root types with additional fields.', () => {
    const validSchema = `
    type Query {
        additionalQueryField: String
    }
    type Mutation {
        additionalMutationField: String
    }
    type Subscription {
        additionalSubscriptionField: String
    }
    type Post @model {
        id: ID!
        title: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema.Properties.Definition
    expect(definition).toBeDefined()
    const parsed = parse(definition);
    const queryType = getObjectType(parsed, 'Query');
    expectFields(queryType, ['getPost', 'listPosts', 'additionalQueryField'])
    const mutationType = getObjectType(parsed, 'Mutation');
    expectFields(mutationType, ['createPost', 'updatePost', 'deletePost', 'additionalMutationField'])
    const subscriptionType = getObjectType(parsed, 'Subscription');
    expectFields(subscriptionType, ['onCreatePost', 'onUpdatePost', 'onDeletePost', 'additionalSubscriptionField'])
});

test('Test custom root query with no mutations/subscriptions.', () => {
    const validSchema = `
    # If I intentionally leave out mutation/subscription then no mutations/subscriptions
    # will be created even if @model is used.
    schema {
        query: Query
    }
    type Query {
        additionalQueryField: String
    }
    type Post @model {
        id: ID!
        title: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema.Properties.Definition
    expect(definition).toBeDefined()
    const parsed = parse(definition);
    const queryType = getObjectType(parsed, 'Query');
    expectFields(queryType, ['getPost', 'listPosts', 'additionalQueryField'])
    const mutationType = getObjectType(parsed, 'Mutation');
    expect(mutationType).toBeUndefined();
    const subscriptionType = getObjectType(parsed, 'Subscription');
    expect(subscriptionType).toBeUndefined();
});

test('Test custom root query & mutation with no subscriptions.', () => {
    const validSchema = `
    # If I intentionally leave out mutation/subscription then no mutations/subscriptions
    # will be created even if @model is used.
    schema {
        query: Query2
        mutation: Mutation2
    }
    type Query2 {
        additionalQueryField: String
    }
    type Mutation2 {
        additionalMutationField: String
    }
    type Post @model {
        id: ID!
        title: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema.Properties.Definition
    expect(definition).toBeDefined()
    const parsed = parse(definition);
    const queryType = getObjectType(parsed, 'Query2');
    expectFields(queryType, ['getPost', 'listPosts', 'additionalQueryField'])
    const mutationType = getObjectType(parsed, 'Mutation2');
    expectFields(mutationType, ['createPost', 'updatePost', 'deletePost', 'additionalMutationField'])
    const subscriptionType = getObjectType(parsed, 'Subscription');
    expect(subscriptionType).toBeUndefined();
});

test('Test custom root query, mutation, and subscriptions.', () => {
    const validSchema = `
    # If I intentionally leave out mutation/subscription then no mutations/subscriptions
    # will be created even if @model is used.
    schema {
        query: Query2
        mutation: Mutation2
        subscription: Subscription2
    }
    type Query2 {
        additionalQueryField: String

        authedField: String
            @aws_auth(cognito_groups: ["Bloggers", "Readers"])
    }
    type Mutation2 {
        additionalMutationField: String
    }
    type Subscription2 {
        onCreateOrUpdate: Post
            @aws_subscribe(mutations: ["createPost", "updatePost"])
    }
    type Post @model {
        id: ID!
        title: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema.Properties.Definition
    expect(definition).toBeDefined()
    const parsed = parse(definition);
    const queryType = getObjectType(parsed, 'Query2');
    expectFields(queryType, ['getPost', 'listPosts', 'additionalQueryField', 'authedField'])
    const authedField = queryType.fields.find(f => f.name.value === 'authedField')
    expect(authedField.directives.length).toEqual(1)
    expect(authedField.directives[0].name.value).toEqual('aws_auth')
    const mutationType = getObjectType(parsed, 'Mutation2');
    expectFields(mutationType, ['createPost', 'updatePost', 'deletePost', 'additionalMutationField'])
    const subscriptionType = getObjectType(parsed, 'Subscription2');
    expectFields(subscriptionType, ['onCreatePost', 'onUpdatePost', 'onDeletePost', 'onCreateOrUpdate'])
});

test('Test custom roots without any directives. This should still be valid.', () => {
    const validSchema = `
    schema {
        query: Query2
        mutation: Mutation2
        subscription: Subscription2
    }
    type Query2 {
        getPost: String
    }
    type Mutation2 {
        putPost: String
    }
    type Subscription2 {
        onPutPost: Post
    }
    type Post {
        id: ID!
        title: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    const schema = out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID]
    expect(schema).toBeDefined()
    const definition = schema.Properties.Definition
    expect(definition).toBeDefined()
    const parsed = parse(definition);
    const queryType = getObjectType(parsed, 'Query2');
    expectFields(queryType, ['getPost'])
    const mutationType = getObjectType(parsed, 'Mutation2');
    expectFields(mutationType, ['putPost'])
    const subscriptionType = getObjectType(parsed, 'Subscription2');
    expectFields(subscriptionType, ['onPutPost'])
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