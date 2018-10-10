import { parse } from 'graphql'
import GraphQLTransform from 'graphql-transformer-core'
import { ResourceConstants, ResolverResourceIDs } from 'graphql-transformer-common'
import { HttpTransformer } from '../HttpTransformer'
import AppSyncTransformer from 'graphql-appsync-transformer'

test('Test HttpTransformer with four basic requests', () => {
    const validSchema = `
    type Comment {
        id: ID!
        content: String @http(method: POST, url: "http://www.api.com/ping")
        content2: String @http(method: PUT, url: "http://www.api.com/ping")
        more: String @http(url: "http://api.com/ping/me/2")
        evenMore: String @http(method: DELETE, url: "http://www.google.com/query/id")
        stillMore: String @http(method: PATCH, url: "https://www.api.com/ping/id")
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
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'content')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'content2')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'more')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'evenMore')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'stillMore')]).toBeTruthy()
});

test('Test HttpTransformer with URL params happy case', () => {
    const validSchema = `
    type Comment {
        id: ID!
        title: String
        complex: CompObj @http(method: GET, url: "https://jsonplaceholder.typicode.com/posts/1")
        complexAgain: CompObj @http(url: "https://jsonplaceholder.typicode.com/posts/2")
        complexPost(
            id: Int,
            title: String,
            body: String,
            userId: Int
        ): CompObj @http(method: POST, url: "https://jsonplaceholder.typicode.com/posts")
        complexPut(
            id: Int!,
            title: String!,
            body: String,
            userId: Int!
        ): CompObj @http(method: PUT, url: "https://jsonplaceholder.typicode.com/posts/:title/:id")
        deleter: String @http(method: DELETE, url: "https://jsonplaceholder.typicode.com/posts/3")
        complexGet(
            id: Int!
        ): CompObj @http(url: "https://jsonplaceholder.typicode.com/posts/:id")
        complexGet2 (
            id: Int!,
            title: String!,
            userId: Int!
        ): CompObj @http(url: "https://jsonplaceholder.typicode.com/posts/:title/:id")
    }
    type CompObj {
        userId: Int
        id: Int
        title: String
        body: String
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
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'complex')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'complexAgain')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'complexPost')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'complexPut')]).toBeTruthy()
    expect(out.Resources[ResolverResourceIDs.ResolverResourceID('Comment', 'deleter')]).toBeTruthy()
});

test('Test that HttpTransformer throws an error when missing protocol in URL argument', () => {
    const validSchema = `
    type Comment {
        id: ID!
        content: String @http(method: POST, url: "www.api.com/ping")
    }
    `
    try {
        const transformer = new GraphQLTransform({
            transformers: [
                new AppSyncTransformer(),
                new HttpTransformer()
            ]
        })
        const out = transformer.transform(validSchema);
    } catch (e) {
        expect(e.name).toEqual('TransformerContractError')
    }
});
