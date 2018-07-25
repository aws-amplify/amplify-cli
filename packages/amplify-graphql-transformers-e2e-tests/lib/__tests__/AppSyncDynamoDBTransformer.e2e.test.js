"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_graphql_transformer_common_1 = require("amplify-graphql-transformer-common");
var amplify_graphql_transform_1 = require("amplify-graphql-transform");
var amplify_graphql_dynamodb_transformer_1 = require("amplify-graphql-dynamodb-transformer");
var CloudFormationClient_1 = require("../CloudFormationClient");
var GraphQLClient_1 = require("../GraphQLClient");
jest.setTimeout(200000);
var cf = new CloudFormationClient_1.CloudFormationClient('us-west-2');
var STACK_NAME = 'TestAppSyncDynamoDBTransformerHappy';
var GRAPHQL_CLIENT = undefined;
function outputValueSelector(key) {
    return function (outputs) {
        var output = outputs.find(function (o) { return o.OutputKey === key; });
        return output ? output.OutputValue : null;
    };
}
beforeAll(function () { return __awaiter(_this, void 0, void 0, function () {
    var validSchema, transformer, out, createStackResponse, finishedStack, getApiEndpoint, getApiKey, endpoint, apiKey, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validSchema = "\n    type Post @model {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n    }\n    ";
                transformer = new amplify_graphql_transform_1.default({
                    transformers: [
                        new amplify_graphql_dynamodb_transformer_1.default()
                    ]
                });
                out = transformer.transform(validSchema);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 5, , 6]);
                console.log('Creating Stack ' + STACK_NAME);
                return [4 /*yield*/, cf.createStack(out, STACK_NAME)];
            case 2:
                createStackResponse = _a.sent();
                expect(createStackResponse).toBeDefined();
                return [4 /*yield*/, cf.waitForStack(STACK_NAME)
                    // Arbitrary wait to make sure everything is ready.
                ];
            case 3:
                finishedStack = _a.sent();
                // Arbitrary wait to make sure everything is ready.
                return [4 /*yield*/, cf.wait(10, function () { return Promise.resolve(); })];
            case 4:
                // Arbitrary wait to make sure everything is ready.
                _a.sent();
                console.log('Successfully created stack ' + STACK_NAME);
                expect(finishedStack).toBeDefined();
                getApiEndpoint = outputValueSelector(amplify_graphql_transformer_common_1.ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
                getApiKey = outputValueSelector(amplify_graphql_transformer_common_1.ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
                endpoint = getApiEndpoint(finishedStack.Outputs);
                apiKey = getApiKey(finishedStack.Outputs);
                expect(apiKey).toBeDefined();
                expect(endpoint).toBeDefined();
                GRAPHQL_CLIENT = new GraphQLClient_1.GraphQLClient(endpoint, { 'x-api-key': apiKey });
                return [3 /*break*/, 6];
            case 5:
                e_1 = _a.sent();
                console.error(e_1);
                expect(true).toEqual(false);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
afterAll(function () { return __awaiter(_this, void 0, void 0, function () {
    var e_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                console.log('Deleting stack ' + STACK_NAME);
                return [4 /*yield*/, cf.deleteStack(STACK_NAME)];
            case 1:
                _a.sent();
                return [4 /*yield*/, cf.waitForStack(STACK_NAME)];
            case 2:
                _a.sent();
                console.log('Successfully deleted stack ' + STACK_NAME);
                return [3 /*break*/, 4];
            case 3:
                e_2 = _a.sent();
                if (e_2.code === 'ValidationError' && e_2.message === "Stack with id " + STACK_NAME + " does not exist") {
                    // The stack was deleted. This is good.
                    expect(true).toEqual(true);
                    console.log('Successfully deleted stack ' + STACK_NAME);
                }
                else {
                    console.error(e_2);
                    expect(true).toEqual(false);
                }
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * Test queries below
 */
test('Test createPost mutation', function () { return __awaiter(_this, void 0, void 0, function () {
    var response, e_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            createPost(input: { title: \"Hello, World!\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n            }\n        }", {})];
            case 1:
                response = _a.sent();
                expect(response.data.createPost.id).toBeDefined();
                expect(response.data.createPost.title).toEqual('Hello, World!');
                expect(response.data.createPost.createdAt).toBeDefined();
                expect(response.data.createPost.updatedAt).toBeDefined();
                return [3 /*break*/, 3];
            case 2:
                e_3 = _a.sent();
                console.error(e_3);
                // fail
                expect(e_3).toBeUndefined();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
test('Test updatePost mutation', function () { return __awaiter(_this, void 0, void 0, function () {
    var createResponse, updateResponse, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            createPost(input: { title: \"Test Update\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n            }\n        }", {})];
            case 1:
                createResponse = _a.sent();
                console.log(JSON.stringify(createResponse, null, 4));
                expect(createResponse.data.createPost.id).toBeDefined();
                expect(createResponse.data.createPost.title).toEqual('Test Update');
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            updatePost(input: { id: \"" + createResponse.data.createPost.id + "\", title: \"Bye, World!\" }) {\n                id\n                title\n            }\n        }", {})];
            case 2:
                updateResponse = _a.sent();
                console.log(JSON.stringify(updateResponse, null, 4));
                expect(updateResponse.data.updatePost.title).toEqual('Bye, World!');
                return [3 /*break*/, 4];
            case 3:
                e_4 = _a.sent();
                console.error(e_4);
                // fail
                expect(e_4).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test deletePost mutation', function () { return __awaiter(_this, void 0, void 0, function () {
    var createResponse, deleteResponse, getResponse, e_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            createPost(input: { title: \"Test Delete\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n            }\n        }", {})];
            case 1:
                createResponse = _a.sent();
                console.log(JSON.stringify(createResponse, null, 4));
                expect(createResponse.data.createPost.id).toBeDefined();
                expect(createResponse.data.createPost.title).toEqual('Test Delete');
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            deletePost(input: { id: \"" + createResponse.data.createPost.id + "\" }) {\n                id\n                title\n            }\n        }", {})];
            case 2:
                deleteResponse = _a.sent();
                console.log(JSON.stringify(deleteResponse, null, 4));
                expect(deleteResponse.data.deletePost.title).toEqual('Test Delete');
                return [4 /*yield*/, GRAPHQL_CLIENT.query("query {\n            getPost(id: \"" + createResponse.data.createPost.id + "\") {\n                id\n                title\n            }\n        }", {})];
            case 3:
                getResponse = _a.sent();
                console.log(JSON.stringify(getResponse, null, 4));
                expect(getResponse.data.getPost).toBeNull();
                return [3 /*break*/, 5];
            case 4:
                e_5 = _a.sent();
                console.error(e_5);
                // fail
                expect(e_5).toBeUndefined();
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
test('Test getPost query', function () { return __awaiter(_this, void 0, void 0, function () {
    var createResponse, getResponse, e_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            createPost(input: { title: \"Test Get\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n            }\n        }", {})];
            case 1:
                createResponse = _a.sent();
                expect(createResponse.data.createPost.id).toBeDefined();
                expect(createResponse.data.createPost.title).toEqual('Test Get');
                return [4 /*yield*/, GRAPHQL_CLIENT.query("query {\n            getPost(id: \"" + createResponse.data.createPost.id + "\") {\n                id\n                title\n            }\n        }", {})];
            case 2:
                getResponse = _a.sent();
                expect(getResponse.data.getPost.title).toEqual('Test Get');
                return [3 /*break*/, 4];
            case 3:
                e_6 = _a.sent();
                console.error(e_6);
                // fail
                expect(e_6).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test listPost query', function () { return __awaiter(_this, void 0, void 0, function () {
    var createResponse, listResponse, items, e_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            createPost(input: { title: \"Test List\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n            }\n        }", {})];
            case 1:
                createResponse = _a.sent();
                expect(createResponse.data.createPost.id).toBeDefined();
                expect(createResponse.data.createPost.title).toEqual('Test List');
                return [4 /*yield*/, GRAPHQL_CLIENT.query("query {\n            listPost {\n                items {\n                    id\n                    title\n                }\n            }\n        }", {})];
            case 2:
                listResponse = _a.sent();
                expect(listResponse.data.listPost.items).toBeDefined;
                items = listResponse.data.listPost.items;
                expect(items.length).toBeGreaterThan(0);
                return [3 /*break*/, 4];
            case 3:
                e_7 = _a.sent();
                console.error(e_7);
                // fail
                expect(e_7).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test listPost query with filter', function () { return __awaiter(_this, void 0, void 0, function () {
    var createResponse, listWithFilterResponse, items, e_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            createPost(input: { title: \"Test List with filter\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n            }\n        }", {})];
            case 1:
                createResponse = _a.sent();
                expect(createResponse.data.createPost.id).toBeDefined();
                expect(createResponse.data.createPost.title).toEqual('Test List with filter');
                return [4 /*yield*/, GRAPHQL_CLIENT.query("query {\n            listPost(filter: {\n                title: {\n                    contains: \"List with filter\"\n                }\n            }) {\n                items {\n                    id\n                    title\n                }\n            }\n        }", {})];
            case 2:
                listWithFilterResponse = _a.sent();
                expect(listWithFilterResponse.data.listPost.items).toBeDefined;
                items = listWithFilterResponse.data.listPost.items;
                expect(items.length).toEqual(1);
                expect(items[0].title).toEqual('Test List with filter');
                return [3 /*break*/, 4];
            case 3:
                e_8 = _a.sent();
                console.error(e_8);
                // fail
                expect(e_8).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test queryPost query', function () { return __awaiter(_this, void 0, void 0, function () {
    var createResponse, queryResponse, items, e_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            createPost(input: { title: \"Test Query\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n            }\n        }", {})];
            case 1:
                createResponse = _a.sent();
                expect(createResponse.data.createPost.id).toBeDefined();
                expect(createResponse.data.createPost.title).toEqual('Test Query');
                return [4 /*yield*/, GRAPHQL_CLIENT.query("query {\n            queryPost {\n                items {\n                    id\n                    title\n                }\n            }\n        }", {})];
            case 2:
                queryResponse = _a.sent();
                expect(queryResponse.data.queryPost.items).toBeDefined;
                items = queryResponse.data.queryPost.items;
                expect(items.length).toBeGreaterThan(0);
                return [3 /*break*/, 4];
            case 3:
                e_9 = _a.sent();
                console.error(e_9);
                // fail
                expect(e_9).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test queryPost query with filter', function () { return __awaiter(_this, void 0, void 0, function () {
    var createResponse, queryWithFilterResponse, items, e_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            createPost(input: { title: \"Test Query with filter\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n            }\n        }", {})];
            case 1:
                createResponse = _a.sent();
                expect(createResponse.data.createPost.id).toBeDefined();
                expect(createResponse.data.createPost.title).toEqual('Test Query with filter');
                return [4 /*yield*/, GRAPHQL_CLIENT.query("query {\n            queryPost(filter: {\n                title: {\n                    contains: \"Query with filter\"\n                }\n            }) {\n                items {\n                    id\n                    title\n                }\n            }\n        }", {})];
            case 2:
                queryWithFilterResponse = _a.sent();
                expect(queryWithFilterResponse.data.queryPost.items).toBeDefined;
                items = queryWithFilterResponse.data.queryPost.items;
                expect(items.length).toEqual(1);
                expect(items[0].title).toEqual('Test Query with filter');
                return [3 /*break*/, 4];
            case 3:
                e_10 = _a.sent();
                console.error(e_10);
                // fail
                expect(e_10).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test queryPost query with filter with sort direction', function () { return __awaiter(_this, void 0, void 0, function () {
    var createResponseOne, createResponseTwo, queryWithFilterResponse, items, e_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            createPost(input: { title: \"Test Query with filter with sort 1\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n            }\n        }", {})];
            case 1:
                createResponseOne = _a.sent();
                expect(createResponseOne.data.createPost.id).toBeDefined();
                expect(createResponseOne.data.createPost.title).toEqual('Test Query with filter with sort 1');
                return [4 /*yield*/, GRAPHQL_CLIENT.query("mutation {\n            createPost(input: { title: \"Test Query with filter with sort 2\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n            }\n        }", {})];
            case 2:
                createResponseTwo = _a.sent();
                expect(createResponseTwo.data.createPost.id).toBeDefined();
                expect(createResponseTwo.data.createPost.title).toEqual('Test Query with filter with sort 2');
                return [4 /*yield*/, GRAPHQL_CLIENT.query("query {\n            queryPost(sortDirection: ASC, filter: {\n                title: {\n                    contains: \"with sort\"\n                }\n            }) {\n                items {\n                    id\n                    title\n                }\n            }\n        }", {})];
            case 3:
                queryWithFilterResponse = _a.sent();
                expect(queryWithFilterResponse.data.queryPost.items).toBeDefined;
                items = queryWithFilterResponse.data.queryPost.items;
                expect(items.length).toEqual(2);
                expect(items[0].id < items[1].id).toBeTruthy;
                return [3 /*break*/, 5];
            case 4:
                e_11 = _a.sent();
                console.error(e_11);
                // fail
                expect(e_11).toBeUndefined();
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=AppSyncDynamoDBTransformer.e2e.test.js.map