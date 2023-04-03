"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
const graphql_function_transformer_1 = require("graphql-function-transformer");
const graphql_transformer_core_1 = require("graphql-transformer-core");
const graphql_client_1 = require("./utils/graphql-client");
const index_1 = require("./utils/index");
jest.setTimeout(2000000);
const ECHO_FUNCTION_NAME = `echoFunction`;
const HELLO_FUNCTION_NAME = `hello`;
let GRAPHQL_CLIENT = undefined;
let server;
beforeAll(async () => {
    const validSchema = `
    type Query {
        echo(msg: String!): Context @function(name: "${ECHO_FUNCTION_NAME}")
        duplicate(msg: String!): Context @function(name: "${ECHO_FUNCTION_NAME}")
        pipeline(msg: String!): String
            @function(name: "${ECHO_FUNCTION_NAME}")
            @function(name: "${HELLO_FUNCTION_NAME}")
        pipelineReverse(msg: String!): Context
            @function(name: "${HELLO_FUNCTION_NAME}")
            @function(name: "${ECHO_FUNCTION_NAME}")
    }
    type Context {
        arguments: Arguments
        typeName: String
        fieldName: String
    }
    type Arguments {
        msg: String!
    }
    `;
    try {
        const transformer = new graphql_transformer_core_1.GraphQLTransform({
            transformers: [new graphql_dynamodb_transformer_1.DynamoDBModelTransformer(), new graphql_function_transformer_1.FunctionTransformer()],
            featureFlags: {
                getBoolean: (name) => (name === 'improvePluralization' ? true : false),
            },
        });
        const out = transformer.transform(validSchema);
        const result = await (0, index_1.deploy)(out);
        server = result.simulator;
        const endpoint = server.url + '/graphql';
        (0, index_1.logDebug)(`Using graphql url: ${endpoint}`);
        const apiKey = result.config.appSync.apiKey;
        GRAPHQL_CLIENT = new graphql_client_1.GraphQLClient(endpoint, { 'x-api-key': apiKey });
    }
    catch (e) {
        (0, index_1.logDebug)(e);
        console.warn(`Could not setup function: ${e}`);
    }
});
afterAll(async () => {
    try {
        if (server) {
            await server.stop();
        }
    }
    catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});
test('Test simple echo function', async () => {
    const response = await GRAPHQL_CLIENT.query(`query {
        echo(msg: "Hello") {
            arguments {
                msg
            }
            typeName
            fieldName
        }
    }`, {});
    (0, index_1.logDebug)(JSON.stringify(response, null, 4));
    expect(response.data.echo.arguments.msg).toEqual('Hello');
    expect(response.data.echo.typeName).toEqual('Query');
    expect(response.data.echo.fieldName).toEqual('echo');
});
test('Test simple duplicate function', async () => {
    const response = await GRAPHQL_CLIENT.query(`query {
        duplicate(msg: "Hello") {
            arguments {
                msg
            }
            typeName
            fieldName
        }
    }`, {});
    (0, index_1.logDebug)(JSON.stringify(response, null, 4));
    expect(response.data.duplicate.arguments.msg).toEqual('Hello');
    expect(response.data.duplicate.typeName).toEqual('Query');
    expect(response.data.duplicate.fieldName).toEqual('duplicate');
});
test('Test pipeline of @function(s)', async () => {
    const response = await GRAPHQL_CLIENT.query(`query {
        pipeline(msg: "IGNORED")
    }`, {});
    (0, index_1.logDebug)(JSON.stringify(response, null, 4));
    expect(response.data.pipeline).toEqual('Hello, world!');
});
test('Test pipelineReverse of @function(s)', async () => {
    const response = await GRAPHQL_CLIENT.query(`query {
        pipelineReverse(msg: "Hello") {
            arguments {
                msg
            }
            typeName
            fieldName
        }
    }`, {});
    (0, index_1.logDebug)(JSON.stringify(response, null, 4));
    expect(response.data.pipelineReverse.arguments.msg).toEqual('Hello');
    expect(response.data.pipelineReverse.typeName).toEqual('Query');
    expect(response.data.pipelineReverse.fieldName).toEqual('pipelineReverse');
});
//# sourceMappingURL=function-transformer.e2e.test.js.map