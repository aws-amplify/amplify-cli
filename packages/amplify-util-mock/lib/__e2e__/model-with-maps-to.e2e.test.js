"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_model_transformer_1 = require("@aws-amplify/graphql-model-transformer");
const graphql_maps_to_transformer_1 = require("@aws-amplify/graphql-maps-to-transformer");
const graphql_auth_transformer_1 = require("@aws-amplify/graphql-auth-transformer");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const graphql_client_1 = require("./utils/graphql-client");
const index_1 = require("./utils/index");
let graphqlClient;
let server;
let dbPath;
let ddbEmulator;
beforeAll(async () => {
    const validSchema = `
    type Todo @model @mapsTo(name: "Task") @auth(rules: [{allow: public}]) {
        id: ID!
        title: String!
        description: String
    }
    `;
    try {
        const transformer = new graphql_transformer_core_1.GraphQLTransform({
            transformers: [new graphql_model_transformer_1.ModelTransformer(), new graphql_auth_transformer_1.AuthTransformer(), new graphql_maps_to_transformer_1.MapsToTransformer()],
            featureFlags: {
                getBoolean: (value, defaultValue) => {
                    if (value === 'userSubUsernameForDefaultIdentityClaim') {
                        return false;
                    }
                    return defaultValue;
                },
                getNumber: jest.fn(),
                getObject: jest.fn(),
            },
        });
        const out = transformer.transform(validSchema);
        let ddbClient;
        ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await (0, index_1.launchDDBLocal)());
        const result = await (0, index_1.deploy)(out, ddbClient);
        server = result.simulator;
        const endpoint = `${server.url}/graphql`;
        (0, index_1.logDebug)(`Using graphql url: ${endpoint}`);
        const { apiKey } = result.config.appSync;
        graphqlClient = new graphql_client_1.GraphQLClient(endpoint, { 'x-api-key': apiKey });
    }
    catch (e) {
        (0, index_1.logDebug)(e);
        console.warn(`Could not setup mock server: ${e}`);
    }
});
afterAll(async () => {
    try {
        if (server) {
            await server.stop();
        }
        await (0, index_1.terminateDDB)(ddbEmulator, dbPath);
    }
    catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});
test('Model with original name specified points to original table', async () => {
    var _a, _b, _c, _d;
    const response = await graphqlClient.query(`mutation {
        createTodo(input: {title: "Test Todo"}) {
            id
            title
        }
    }`, {});
    (0, index_1.logDebug)(JSON.stringify(response, null, 2));
    expect((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.createTodo) === null || _b === void 0 ? void 0 : _b.id).toBeDefined();
    expect((_d = (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.createTodo) === null || _d === void 0 ? void 0 : _d.title).toEqual('Test Todo');
});
//# sourceMappingURL=model-with-maps-to.e2e.test.js.map