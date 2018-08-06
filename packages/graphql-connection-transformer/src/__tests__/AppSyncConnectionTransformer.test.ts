import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transform'
import { ResourceConstants, ResolverResourceIDs } from 'graphql-transformer-common'
import { AppSyncDynamoDBTransformer } from 'graphql-dynamodb-transformer'
import { AppSyncConnectionTransformer } from '../AppSyncConnectionTransformer'
import AppSyncTransformer from 'graphql-appsync-transformer'

test('Test AppSyncConnectionTransformer simple one to many happy case', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @connection
    }
    type Comment @model {
        id: ID!
        content: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new AppSyncDynamoDBTransformer(),
            new AppSyncConnectionTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy()
});

test('Test AppSyncConnectionTransformer complex one to many happy case', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @connection(name: "PostComments")
    }
    type Comment @model {
        id: ID!
        content: String
        post: Post @connection(name: "PostComments")
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new AppSyncDynamoDBTransformer(),
            new AppSyncConnectionTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'post')]).toBeTruthy()
    const schemaDoc = parse(out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition)
    const postType = getObjectType(schemaDoc, 'Post')
    expectFields(postType, ['comments'])
    const commentField = postType.fields.find(f => f.name.value === 'comments')
    expect(commentField.arguments.length).toEqual(4)
    expectArguments(commentField, ['filter', 'limit', 'nextToken', 'sortDirection'])
});

function expectFields(type: ObjectTypeDefinitionNode, fields: string[]) {
    for (const fieldName of fields) {
        const foundField = type.fields.find((f: FieldDefinitionNode) => f.name.value === fieldName)
        expect(foundField).toBeDefined()
    }
}

function expectArguments(field: FieldDefinitionNode, args: string[]) {
    for (const argName of args) {
        const foundArg = field.arguments.find((a: InputValueDefinitionNode) => a.name.value === argName)
        expect(foundArg).toBeDefined()
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