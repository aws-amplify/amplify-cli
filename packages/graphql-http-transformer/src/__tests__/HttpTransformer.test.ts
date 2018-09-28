import {
    ObjectTypeDefinitionNode, parse, FieldDefinitionNode, DocumentNode,
    DefinitionNode, Kind, InputObjectTypeDefinitionNode,
    InputValueDefinitionNode
} from 'graphql'
import GraphQLTransform from 'graphql-transformer-core'
import { ResourceConstants, ResolverResourceIDs, ModelResourceIDs } from 'graphql-transformer-common'
import DynamoDBModelTransformer from 'graphql-dynamodb-transformer'
import { HttpTransformer } from '../HttpTransformer'
import AppSyncTransformer from 'graphql-appsync-transformer'

test('Test HttpTransformer simple one to many happy case', () => {
    const validSchema = `
    type Comment {
        id: ID!
        content: String @http(url: "http://www.api.com/ping")
        more: String @http(url: "http://api.com/ping/me/2")
        evenMore: String @http(url: "http://www.google.com/query/:id")
    }
    `
    const transformer = new GraphQLTransform({
        transformers: [
            new AppSyncTransformer(),
            new HttpTransformer()
        ]
    })
    const out = transformer.transform(validSchema);
    expect(out).toBeDefined()
    // expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Post', 'comments')]).toBeTruthy()
    const schemaDoc = parse(out.Resources[ResourceConstants.RESOURCES.GraphQLSchemaLogicalID].Properties.Definition)

    // // Post.comments field
    // const postType = getObjectType(schemaDoc, 'Post')
    // expectFields(postType, ['comments'])
    // const commentField = postType.fields.find(f => f.name.value === 'comments')
    // expect(commentField.arguments.length).toEqual(4)
    // expectArguments(commentField, ['filter', 'limit', 'nextToken', 'sortDirection'])
    // expect(commentField.type.kind).toEqual(Kind.NAMED_TYPE)
    // expect((commentField.type as any).name.value).toEqual('ModelCommentConnection')

    // // Check the Comment.commentPostId
    // // Check the Comment.commentPostId inputs
    // const commentCreateInput = getInputType(schemaDoc, ModelResourceIDs.ModelCreateInputObjectName('Comment'))
    // const connectionId = commentCreateInput.fields.find(f => f.name.value === 'postCommentsId')
    // expect(connectionId).toBeTruthy()

    // const commentUpdateInput = getInputType(schemaDoc, ModelResourceIDs.ModelUpdateInputObjectName('Comment'))
    // const connectionUpdateId = commentUpdateInput.fields.find(f => f.name.value === 'postCommentsId')
    // expect(connectionUpdateId).toBeTruthy()
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