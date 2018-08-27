import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transformer-core'
import { ResourceConstants, ResolverResourceIDs, ModelResourceIDs } from 'graphql-transformer-common'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import { ModelConnectionTransformer } from '../ModelConnectionTransformer'
import AppSyncTransformer from 'graphql-appsync-transformer'

test('Test ModelConnectionTransformer simple one to many happy case', () => {
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
            new DynamoDBModelTransformer(),
            new ModelConnectionTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy()
    const schemaDoc = parse(out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition)

    // Post.comments field
    const postType = getObjectType(schemaDoc, 'Post')
    expectFields(postType, ['comments'])
    const commentField = postType.fields.find(f => f.name.value === 'comments')
    expect(commentField.arguments.length).toEqual(4)
    expectArguments(commentField, ['filter', 'limit', 'nextToken', 'sortDirection'])
    expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE)
    expect((commentField.type as any).name.value).toEqual('ModelCommentConnection')

    // Check the Comment.commentPostId
    // Check the Comment.commentPostId inputs
    const commentCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Comment'))
    const connectionId = commentCreateInput.fields.find(f => f.name.value === 'postCommentsId')
    expect(connectionId).toBeTruthy()

    const commentUpdateInput = getInputType(schemaDoc, ModelResourceIDs.ModelUpdateInputObjectName('Comment'))
    const connectionUpdateId = commentUpdateInput.fields.find(f => f.name.value === 'postCommentsId')
    expect(connectionUpdateId).toBeTruthy()
});

test('Test ModelConnectionTransformer simple one to many happy case with custom keyField', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @connection(keyField: "postId")
    }
    type Comment @model {
        id: ID!
        content: String
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new ModelConnectionTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy()
    const schemaDoc = parse(out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition)

    // Post.comments field
    const postType = getObjectType(schemaDoc, 'Post')
    expectFields(postType, ['comments'])
    const commentField = postType.fields.find(f => f.name.value === 'comments')
    expect(commentField.arguments.length).toEqual(4)
    expectArguments(commentField, ['filter', 'limit', 'nextToken', 'sortDirection'])
    expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE)
    expect((commentField.type as any).name.value).toEqual('ModelCommentConnection')

    // Check the Comment.commentPostId
    // Check the Comment.commentPostId inputs
    const commentCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Comment'))
    const connectionId = commentCreateInput.fields.find(f => f.name.value === 'postId')
    expect(connectionId).toBeTruthy()

    const commentUpdateInput = getInputType(schemaDoc, ModelResourceIDs.ModelUpdateInputObjectName('Comment'))
    const connectionUpdateId = commentUpdateInput.fields.find(f => f.name.value === 'postId')
    expect(connectionUpdateId).toBeTruthy()
});

test('Test ModelConnectionTransformer simple one to many happy case with custom keyField', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        createdAt: String
        updatedAt: String
        comments: [Comment] @connection(name: "PostComments", keyField: "postId")
    }
    type Comment @model {
        id: ID!
        content: String!
        post: Post @connection(name: "PostComments", keyField: "postId")
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new ModelConnectionTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy()
    const schemaDoc = parse(out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition)

    // Post.comments field
    const postType = getObjectType(schemaDoc, 'Post')
    expectFields(postType, ['comments'])
    const commentField = postType.fields.find(f => f.name.value === 'comments')
    expect(commentField.arguments.length).toEqual(4)
    expectArguments(commentField, ['filter', 'limit', 'nextToken', 'sortDirection'])
    expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE)
    expect((commentField.type as any).name.value).toEqual('ModelCommentConnection')

    // Check the Comment.commentPostId
    // Check the Comment.commentPostId inputs
    const commentCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Comment'))
    const connectionId = commentCreateInput.fields.find(f => f.name.value === 'postId')
    expect(connectionId).toBeTruthy()

    const commentUpdateInput = getInputType(schemaDoc, ModelResourceIDs.ModelUpdateInputObjectName('Comment'))
    const connectionUpdateId = commentUpdateInput.fields.find(f => f.name.value === 'postId')
    expect(connectionUpdateId).toBeTruthy()
});

test('Test ModelConnectionTransformer complex one to many happy case', () => {
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
            new DynamoDBModelTransformer(),
            new ModelConnectionTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'post')]).toBeTruthy()
    const schemaDoc = parse(out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition)
    const postType = getObjectType(schemaDoc, 'Post')
    const commentType = getObjectType(schemaDoc, 'Comment')

    // Check Post.comments field
    expectFields(postType, ['comments'])
    const commentField = postType.fields.find(f => f.name.value === 'comments')
    expect(commentField.arguments.length).toEqual(4)
    expectArguments(commentField, ['filter', 'limit', 'nextToken', 'sortDirection'])
    expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE)
    expect((commentField.type as any).name.value).toEqual('ModelCommentConnection')

    // Check the Comment.commentPostId inputs
    const commentCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Comment'))
    const connectionId = commentCreateInput.fields.find(f => f.name.value === 'commentPostId')
    expect(connectionId).toBeTruthy()

    const commentUpdateInput = getInputType(schemaDoc, ModelResourceIDs.ModelUpdateInputObjectName('Comment'))
    const connectionUpdateId = commentUpdateInput.fields.find(f => f.name.value === 'commentPostId')
    expect(connectionUpdateId).toBeTruthy()

    // Check Comment.post field
    const postField = commentType.fields.find(f => f.name.value === 'post')
    expect(postField.arguments.length).toEqual(0)
    expect(postField.type.kind).toEqual(Kind.NAMED_TYPE)
    expect((postField.type as any).name.value).toEqual('Post')
});

test('Test ModelConnectionTransformer many to many should fail', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @connection(name: "ManyToMany")
    }
    type Comment @model {
        id: ID!
        content: String
        posts: [Post] @connection(name: "ManyToMany")
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new ModelConnectionTransformer()
        ]
    })
    try {
        transformer.transform(validSchema);
        expect(true).toEqual(false)
    } catch (e) {
        // Should throw bc we don't let support many to many
        expect(e).toBeTruthy()
        expect(e.name).toEqual('InvalidDirectiveError')
    }
});

test('Test ModelConnectionTransformer many to many should fail due to missing other "name"', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        title: String!
        comments: [Comment] @connection(name: "ManyToMany")
    }
    type Comment @model {
        id: ID!
        content: String

        # This is meant to be the other half of "ManyToMany" but I forgot.
        posts: [Post] @connection
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new ModelConnectionTransformer()
        ]
    })
    try {
        transformer.transform(validSchema);
        expect(true).toEqual(false)
    } catch (e) {
        // Should throw bc we check both halves when name is given
        expect(e).toBeTruthy()
        expect(e.name).toEqual('InvalidDirectiveError')
    }
});

test('Test ModelConnectionTransformer many to many should fail due to missing other "name"', () => {
    const validSchema = `
    type Post @model {
        id: ID!
        things: [Thing!] @connection
    }

    type Thing @model(queries: null, mutations: null) {
        id: ID!
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new DynamoDBModelTransformer(),
            new ModelConnectionTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'things')]).toBeTruthy()
    const schemaDoc = parse(out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition)
    const postType = getObjectType(schemaDoc, 'Post')
    const postConnection = getObjectType(schemaDoc, 'ModelPostConnection')
    const thingConnection = getObjectType(schemaDoc, 'ModelThingConnection')
    const thingFilterInput = getInputType(schemaDoc, 'ModelThingFilterInput')
    expect(thingFilterInput).toBeDefined()
    expect(postType).toBeDefined()
    expect(thingConnection).toBeDefined()
    expect(postConnection).toBeDefined()
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