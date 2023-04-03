"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const graphql_client_1 = require("./utils/graphql-client");
const index_1 = require("./utils/index");
let GRAPHQL_ENDPOINT = undefined;
let GRAPHQL_CLIENT = undefined;
let ddbEmulator = null;
let dbPath = null;
let server;
jest.setTimeout(2000000);
const runTransformer = async (validSchema) => {
    const transformer = new graphql_transformer_core_1.GraphQLTransform({
        transformers: [new graphql_dynamodb_transformer_1.DynamoDBModelTransformer()],
        featureFlags: {
            getBoolean: (name) => (name === 'improvePluralization' ? true : false),
        },
    });
    const out = await transformer.transform(validSchema);
    return out;
};
let ddbClient;
const validSchema = `
  type Post @model {
    id: ID!
    title: String!
  }
`;
beforeAll(async () => {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    try {
        const out = await runTransformer(validSchema);
        ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await (0, index_1.launchDDBLocal)());
        const result = await (0, index_1.deploy)(out, ddbClient);
        server = result.simulator;
        GRAPHQL_ENDPOINT = server.url + '/graphql';
        (0, index_1.logDebug)(`Using graphql url: ${GRAPHQL_ENDPOINT}`);
        const apiKey = result.config.appSync.apiKey;
        (0, index_1.logDebug)(apiKey);
        GRAPHQL_CLIENT = new graphql_client_1.GraphQLClient(GRAPHQL_ENDPOINT, {
            'x-api-key': apiKey,
        });
    }
    catch (e) {
        (0, index_1.logDebug)('error when setting up test');
        (0, index_1.logDebug)(e);
        expect(true).toEqual(false);
    }
});
afterEach(async () => {
    const out = await runTransformer(validSchema);
    await (0, index_1.reDeploy)(out, server, ddbClient);
});
afterAll(async () => {
    if (server) {
        await server.stop();
    }
    await (0, index_1.terminateDDB)(ddbEmulator, dbPath);
});
describe('$util.validate', () => {
    let transformerOutput;
    const queryString = `
    query getPost {
      getPost(id: "10") {
        id
        title
      }
    }
  `;
    beforeEach(async () => {
        transformerOutput = await runTransformer(validSchema);
    });
    test('it should not throw error when validation condition is true', async () => {
        transformerOutput.resolvers['Query.getPost.res.vtl'] = `$util.validate(true, "Validation Error", "ValidationError", { "id": "11", "title": "Title Sent from Error" })\n$util.toJson({"id": 11, "title": "Non Error title"})`;
        await (0, index_1.reDeploy)(transformerOutput, server, ddbClient);
        const response = await GRAPHQL_CLIENT.query(queryString, {});
        expect(response.data).toBeDefined();
        expect(response.data.getPost.id).toEqual('11');
        expect(response.data.getPost.title).toEqual('Non Error title');
        expect(response.errors).not.toBeDefined();
    });
    test('$util.validate should throw error and pass the data along with error message and error type when the condition fails', async () => {
        transformerOutput.resolvers['Query.getPost.req.vtl'] = `$util.validate(false, "Validation Error", "ValidationError", { "id": "10", "title": "Title Sent from Error" })`;
        await (0, index_1.reDeploy)(transformerOutput, server, ddbClient);
        const response = await GRAPHQL_CLIENT.query(queryString, {});
        expect(response.data).toBeDefined();
        expect(response.data.getPost.id).toEqual('10');
        expect(response.data.getPost.title).toEqual('Title Sent from Error');
        expect(response.errors).toBeDefined();
        expect(response.errors).toHaveLength(1);
        expect(response.errors[0].message).toEqual('Validation Error');
        expect(response.errors[0].errorType).toEqual('ValidationError');
    });
    test('$util.validate should return error message and CustomTemplateException when error type is not passed', async () => {
        transformerOutput.resolvers['Query.getPost.req.vtl'] = `$util.validate(false, "Validation Error")`;
        await (0, index_1.reDeploy)(transformerOutput, server, ddbClient);
        const response = await GRAPHQL_CLIENT.query(queryString, {});
        expect(response.data).toBeDefined();
        expect(response.data.getPost).toBe(null);
        expect(response.errors).toBeDefined();
        expect(response.errors).toHaveLength(1);
        expect(response.errors[0].message).toEqual('Validation Error');
        expect(response.errors[0].errorType).toEqual('CustomTemplateException');
    });
    test('$util.validate should allow overriding the error type', async () => {
        transformerOutput.resolvers['Query.getPost.req.vtl'] = `$util.validate(false, "Validation Error", "MyErrorType")`;
        await (0, index_1.reDeploy)(transformerOutput, server, ddbClient);
        const response = await GRAPHQL_CLIENT.query(queryString, {});
        expect(response.data).toBeDefined();
        expect(response.data.getPost).toBe(null);
        expect(response.errors).toBeDefined();
        expect(response.errors).toHaveLength(1);
        expect(response.errors[0].message).toEqual('Validation Error');
        expect(response.errors[0].errorType).toEqual('MyErrorType');
    });
});
//# sourceMappingURL=util-method-e2e.test.js.map