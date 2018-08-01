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
var aws_amplify_1 = require("aws-amplify");
var graphql_transformer_common_1 = require("graphql-transformer-common");
var graphql_transform_1 = require("graphql-transform");
var graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
var graphql_auth_transformer_1 = require("graphql-auth-transformer");
var CloudFormationClient_1 = require("../CloudFormationClient");
var TestStorage_1 = require("../TestStorage");
var GraphQLClient_1 = require("../GraphQLClient");
var graphql_appsync_transformer_1 = require("graphql-appsync-transformer");
// to deal with bug in cognito-identity-js
global.fetch = require("node-fetch");
jest.setTimeout(200000);
var cf = new CloudFormationClient_1.CloudFormationClient('us-west-2');
var STACK_NAME = 'TestAppSyncAuthTransformerTest';
var GRAPHQL_ENDPOINT = undefined;
/**
 * Client 1 is logged in as testuser who is is the Admin and Dev groups.
 */
var GRAPHQL_CLIENT_1 = undefined;
/**
 * Client 2 is logged in as invaliduser who is is the Dev group.
 */
var GRAPHQL_CLIENT_2 = undefined;
var USERNAME1 = 'testuser';
var USERPASSWORD1 = '9S^tp^nv5wWJ2jIv';
var USERNAME2 = 'invaliduser';
var USERPASSWORD2 = 'HbD*D94xS86%ymhc';
function outputValueSelector(key) {
    return function (outputs) {
        var output = outputs.find(function (o) { return o.OutputKey === key; });
        return output ? output.OutputValue : null;
    };
}
// type Membership @model @auth(allow: groups, groupsField: "group") {
//     id: ID!
//     member: String
//     group: String
// }
// type Editable @model @auth(allow: groups, groupsField: "groups") {
//     id: ID!
//     content: String
//     groups: [String]
// }
beforeAll(function () { return __awaiter(_this, void 0, void 0, function () {
    var validSchema, transformer, out, userPoolId, createStackResponse, finishedStack, getApiEndpoint, getApiKey, getUserPoolClientID, apiKey, userPoolClientId, session, idToken, session2, idToken2, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                validSchema = "\n    type Post @model @auth(allow: owner) {\n        id: ID!\n        title: String!\n        createdAt: String\n        updatedAt: String\n        owner: String\n    }\n    type Salary @model @auth(allow: groups, groups: [\"Admin\"]) {\n        id: ID!\n        wage: Int\n    }\n    type ManyGroupProtected @model @auth(allow: groups, groupsField: \"groups\") {\n        id: ID!\n        value: Int\n        groups: [String]\n    }\n    type SingleGroupProtected @model @auth(allow: groups, groupsField: \"group\") {\n        id: ID!\n        value: Int\n        group: String\n    }\n    ";
                transformer = new graphql_transform_1.default({
                    transformers: [
                        new graphql_appsync_transformer_1.default(),
                        new graphql_dynamodb_transformer_1.default(),
                        new graphql_auth_transformer_1.default()
                    ]
                });
                out = transformer.transform(validSchema);
                _a.label = 1;
            case 1:
                _a.trys.push([1, 10, , 11]);
                console.log('Creating Stack ' + STACK_NAME);
                userPoolId = 'us-west-2_21A7JBDkX';
                return [4 /*yield*/, cf.createStack(out, STACK_NAME, userPoolId)];
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
                getApiEndpoint = outputValueSelector(graphql_transformer_common_1.ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
                getApiKey = outputValueSelector(graphql_transformer_common_1.ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
                getUserPoolClientID = outputValueSelector(graphql_transformer_common_1.ResourceConstants.OUTPUTS.AuthCognitoUserPoolJSClientOutput);
                GRAPHQL_ENDPOINT = getApiEndpoint(finishedStack.Outputs);
                apiKey = getApiKey(finishedStack.Outputs);
                userPoolClientId = getUserPoolClientID(finishedStack.Outputs);
                console.log("UserPoolId: " + userPoolId + ". UserPoolClientId: " + userPoolClientId);
                expect(apiKey).toBeDefined();
                expect(GRAPHQL_ENDPOINT).toBeDefined();
                expect(userPoolId).toBeDefined();
                expect(userPoolClientId).toBeDefined();
                aws_amplify_1.default.configure({
                    Auth: {
                        // REQUIRED - Amazon Cognito Region
                        region: 'us-west-2',
                        userPoolId: userPoolId,
                        userPoolWebClientId: userPoolClientId,
                        storage: new TestStorage_1.default()
                    }
                });
                console.log("Signing in as " + USERNAME1);
                return [4 /*yield*/, aws_amplify_1.Auth.signIn(USERNAME1, USERPASSWORD1)];
            case 5:
                _a.sent();
                return [4 /*yield*/, aws_amplify_1.Auth.currentSession()];
            case 6:
                session = _a.sent();
                idToken = session.getIdToken().getJwtToken();
                console.log("USER TOKEN!");
                console.log(idToken);
                GRAPHQL_CLIENT_1 = new GraphQLClient_1.GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken });
                console.log("Signing in as " + USERNAME2);
                return [4 /*yield*/, aws_amplify_1.Auth.signIn(USERNAME2, USERPASSWORD2)];
            case 7:
                _a.sent();
                return [4 /*yield*/, aws_amplify_1.Auth.currentSession()];
            case 8:
                session2 = _a.sent();
                idToken2 = session2.getIdToken().getJwtToken();
                console.log("USER TOKEN 2!");
                console.log(idToken2);
                GRAPHQL_CLIENT_2 = new GraphQLClient_1.GraphQLClient(GRAPHQL_ENDPOINT, { Authorization: idToken2 });
                console.log("Signing up for pool " + userPoolId + " w/ client " + userPoolClientId);
                // Wait for any propagation to avoid random
                // "The security token included in the request is invalid" errors
                return [4 /*yield*/, new Promise(function (res) { return setTimeout(function () { return res(); }, 5000); })];
            case 9:
                // Wait for any propagation to avoid random
                // "The security token included in the request is invalid" errors
                _a.sent();
                return [3 /*break*/, 11];
            case 10:
                e_1 = _a.sent();
                console.error(e_1);
                expect(true).toEqual(false);
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
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
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("mutation {\n            createPost(input: { title: \"Hello, World!\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 1:
                response = _a.sent();
                expect(response.data.createPost.id).toBeDefined();
                expect(response.data.createPost.title).toEqual('Hello, World!');
                expect(response.data.createPost.createdAt).toBeDefined();
                expect(response.data.createPost.updatedAt).toBeDefined();
                expect(response.data.createPost.owner).toBeDefined();
                return [3 /*break*/, 3];
            case 2:
                e_3 = _a.sent();
                console.error(JSON.stringify(e_3.response.data));
                // fail
                expect(e_3).toBeUndefined();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
test('Test getPost query when authorized', function () { return __awaiter(_this, void 0, void 0, function () {
    var response, getResponse, e_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("mutation {\n            createPost(input: { title: \"Hello, World!\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 1:
                response = _a.sent();
                expect(response.data.createPost.id).toBeDefined();
                expect(response.data.createPost.title).toEqual('Hello, World!');
                expect(response.data.createPost.createdAt).toBeDefined();
                expect(response.data.createPost.updatedAt).toBeDefined();
                expect(response.data.createPost.owner).toBeDefined();
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("query {\n            getPost(id: \"" + response.data.createPost.id + "\") {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 2:
                getResponse = _a.sent();
                expect(getResponse.data.getPost.id).toBeDefined();
                expect(getResponse.data.getPost.title).toEqual('Hello, World!');
                expect(getResponse.data.getPost.createdAt).toBeDefined();
                expect(getResponse.data.getPost.updatedAt).toBeDefined();
                expect(getResponse.data.getPost.owner).toBeDefined();
                return [3 /*break*/, 4];
            case 3:
                e_4 = _a.sent();
                console.error(e_4);
                console.error(JSON.stringify(e_4.response.data));
                // fail
                expect(e_4).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test getPost query when not authorized', function () { return __awaiter(_this, void 0, void 0, function () {
    var response, getResponse, e_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("mutation {\n            createPost(input: { title: \"Hello, World!\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 1:
                response = _a.sent();
                expect(response.data.createPost.id).toBeDefined();
                expect(response.data.createPost.title).toEqual('Hello, World!');
                expect(response.data.createPost.createdAt).toBeDefined();
                expect(response.data.createPost.updatedAt).toBeDefined();
                expect(response.data.createPost.owner).toBeDefined();
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("query {\n            getPost(id: \"" + response.data.createPost.id + "\") {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 2:
                getResponse = _a.sent();
                expect(getResponse.data.getPost).toEqual(null);
                expect(getResponse.errors.length).toEqual(1);
                expect(getResponse.errors[0].errorType).toEqual('Unauthorized');
                return [3 /*break*/, 4];
            case 3:
                e_5 = _a.sent();
                console.error(e_5);
                console.error(JSON.stringify(e_5.response.data));
                // fail
                expect(e_5).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test updatePost mutation when authorized', function () { return __awaiter(_this, void 0, void 0, function () {
    var response, updateResponse, e_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("mutation {\n            createPost(input: { title: \"Hello, World!\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 1:
                response = _a.sent();
                expect(response.data.createPost.id).toBeDefined();
                expect(response.data.createPost.title).toEqual('Hello, World!');
                expect(response.data.createPost.createdAt).toBeDefined();
                expect(response.data.createPost.updatedAt).toBeDefined();
                expect(response.data.createPost.owner).toBeDefined();
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("mutation {\n            updatePost(input: { id: \"" + response.data.createPost.id + "\", title: \"Bye, World!\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 2:
                updateResponse = _a.sent();
                expect(updateResponse.data.updatePost.id).toEqual(response.data.createPost.id);
                expect(updateResponse.data.updatePost.title).toEqual('Bye, World!');
                expect(updateResponse.data.updatePost.updatedAt > response.data.createPost.updatedAt).toEqual(true);
                return [3 /*break*/, 4];
            case 3:
                e_6 = _a.sent();
                console.error(e_6);
                console.error(JSON.stringify(e_6.response.data));
                // fail
                expect(e_6).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test updatePost mutation when not authorized', function () { return __awaiter(_this, void 0, void 0, function () {
    var response, updateResponse, e_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("mutation {\n            createPost(input: { title: \"Hello, World!\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 1:
                response = _a.sent();
                expect(response.data.createPost.id).toBeDefined();
                expect(response.data.createPost.title).toEqual('Hello, World!');
                expect(response.data.createPost.createdAt).toBeDefined();
                expect(response.data.createPost.updatedAt).toBeDefined();
                expect(response.data.createPost.owner).toBeDefined();
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("mutation {\n            updatePost(input: { id: \"" + response.data.createPost.id + "\", title: \"Bye, World!\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 2:
                updateResponse = _a.sent();
                expect(updateResponse.data.updatePost).toEqual(null);
                expect(updateResponse.errors.length).toEqual(1);
                expect(updateResponse.errors[0].errorType).toEqual('DynamoDB:ConditionalCheckFailedException');
                return [3 /*break*/, 4];
            case 3:
                e_7 = _a.sent();
                console.error(e_7);
                console.error(JSON.stringify(e_7.response.data));
                // fail
                expect(e_7).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test deletePost mutation when authorized', function () { return __awaiter(_this, void 0, void 0, function () {
    var response, deleteResponse, e_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("mutation {\n            createPost(input: { title: \"Hello, World!\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 1:
                response = _a.sent();
                expect(response.data.createPost.id).toBeDefined();
                expect(response.data.createPost.title).toEqual('Hello, World!');
                expect(response.data.createPost.createdAt).toBeDefined();
                expect(response.data.createPost.updatedAt).toBeDefined();
                expect(response.data.createPost.owner).toBeDefined();
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("mutation {\n            deletePost(input: { id: \"" + response.data.createPost.id + "\" }) {\n                id\n            }\n        }", {})];
            case 2:
                deleteResponse = _a.sent();
                expect(deleteResponse.data.deletePost.id).toEqual(response.data.createPost.id);
                return [3 /*break*/, 4];
            case 3:
                e_8 = _a.sent();
                console.error(e_8);
                console.error(JSON.stringify(e_8.response.data));
                // fail
                expect(e_8).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test deletePost mutation when not authorized', function () { return __awaiter(_this, void 0, void 0, function () {
    var response, deleteResponse, e_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("mutation {\n            createPost(input: { title: \"Hello, World!\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 1:
                response = _a.sent();
                expect(response.data.createPost.id).toBeDefined();
                expect(response.data.createPost.title).toEqual('Hello, World!');
                expect(response.data.createPost.createdAt).toBeDefined();
                expect(response.data.createPost.updatedAt).toBeDefined();
                expect(response.data.createPost.owner).toBeDefined();
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("mutation {\n            deletePost(input: { id: \"" + response.data.createPost.id + "\" }) {\n                id\n            }\n        }", {})];
            case 2:
                deleteResponse = _a.sent();
                expect(deleteResponse.data.deletePost).toEqual(null);
                expect(deleteResponse.errors.length).toEqual(1);
                expect(deleteResponse.errors[0].errorType).toEqual('DynamoDB:ConditionalCheckFailedException');
                return [3 /*break*/, 4];
            case 3:
                e_9 = _a.sent();
                console.error(e_9);
                console.error(JSON.stringify(e_9.response.data));
                // fail
                expect(e_9).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test('Test listPost mutation when authorized', function () { return __awaiter(_this, void 0, void 0, function () {
    var firstPost, secondPost, listResponse, e_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("mutation {\n            createPost(input: { title: \"testing list\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})];
            case 1:
                firstPost = _a.sent();
                expect(firstPost.data.createPost.id).toBeDefined();
                expect(firstPost.data.createPost.title).toEqual('testing list');
                expect(firstPost.data.createPost.createdAt).toBeDefined();
                expect(firstPost.data.createPost.updatedAt).toBeDefined();
                expect(firstPost.data.createPost.owner).toBeDefined();
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("mutation {\n            createPost(input: { title: \"testing list\" }) {\n                id\n                title\n                createdAt\n                updatedAt\n                owner\n            }\n        }", {})
                    // There are two posts but only 1 created by me.
                ];
            case 2:
                secondPost = _a.sent();
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("query {\n            listPost(filter: { title: { eq: \"testing list\" } }, limit: 25) {\n                items {\n                    id\n                }\n            }\n        }", {})];
            case 3:
                listResponse = _a.sent();
                console.log(JSON.stringify(listResponse, null, 4));
                expect(listResponse.data.listPost.items.length).toEqual(1);
                return [3 /*break*/, 5];
            case 4:
                e_10 = _a.sent();
                console.error(e_10);
                console.error(JSON.stringify(e_10.response.data));
                // fail
                expect(e_10).toBeUndefined();
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
/**
 * Static Group Auth
 */
test("Test createSalary w/ Admin group protection authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, e_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createSalary(input: { wage: 10 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSalary.id).toBeDefined();
                expect(req.data.createSalary.wage).toEqual(10);
                return [3 /*break*/, 3];
            case 2:
                e_11 = _a.sent();
                console.error(e_11);
                expect(e_11).toBeUndefined();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
test("Test createSalary w/ Admin group protection not unauthorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, e_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("\n        mutation {\n            createSalary(input: { wage: 10 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSalary).toEqual(null);
                expect(req.errors.length).toEqual(1);
                expect(req.errors[0].errorType).toEqual('Unauthorized');
                return [3 /*break*/, 3];
            case 2:
                e_12 = _a.sent();
                expect(e_12).toBeUndefined();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
test("Test updateSalary w/ Admin group protection authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, req2, e_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createSalary(input: { wage: 11 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSalary.id).toBeDefined();
                expect(req.data.createSalary.wage).toEqual(11);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            updateSalary(input: { id: \"" + req.data.createSalary.id + "\", wage: 12 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 2:
                req2 = _a.sent();
                expect(req2.data.updateSalary.id).toEqual(req.data.createSalary.id);
                expect(req2.data.updateSalary.wage).toEqual(12);
                return [3 /*break*/, 4];
            case 3:
                e_13 = _a.sent();
                console.error(e_13);
                expect(e_13).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test("Test updateSalary w/ Admin group protection not authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, req2, e_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createSalary(input: { wage: 13 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSalary.id).toBeDefined();
                expect(req.data.createSalary.wage).toEqual(13);
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("\n        mutation {\n            updateSalary(input: { id: \"" + req.data.createSalary.id + "\", wage: 14 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 2:
                req2 = _a.sent();
                expect(req2.data.updateSalary).toEqual(null);
                expect(req2.errors.length).toEqual(1);
                expect(req2.errors[0].errorType).toEqual('Unauthorized');
                return [3 /*break*/, 4];
            case 3:
                e_14 = _a.sent();
                console.error(e_14);
                expect(e_14).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test("Test deleteSalary w/ Admin group protection authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, req2, e_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createSalary(input: { wage: 15 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSalary.id).toBeDefined();
                expect(req.data.createSalary.wage).toEqual(15);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            deleteSalary(input: { id: \"" + req.data.createSalary.id + "\" }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 2:
                req2 = _a.sent();
                expect(req2.data.deleteSalary.id).toEqual(req.data.createSalary.id);
                expect(req2.data.deleteSalary.wage).toEqual(15);
                return [3 /*break*/, 4];
            case 3:
                e_15 = _a.sent();
                console.error(e_15);
                expect(e_15).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test("Test deleteSalary w/ Admin group protection not authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, req2, e_16;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createSalary(input: { wage: 16 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSalary.id).toBeDefined();
                expect(req.data.createSalary.wage).toEqual(16);
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("\n        mutation {\n            deleteSalary(input: { id: \"" + req.data.createSalary.id + "\" }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 2:
                req2 = _a.sent();
                expect(req2.data.deleteSalary).toEqual(null);
                expect(req2.errors.length).toEqual(1);
                expect(req2.errors[0].errorType).toEqual('Unauthorized');
                return [3 /*break*/, 4];
            case 3:
                e_16 = _a.sent();
                console.error(e_16);
                expect(e_16).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test("Test getSalary w/ Admin group protection authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, req2, e_17;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createSalary(input: { wage: 15 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSalary.id).toBeDefined();
                expect(req.data.createSalary.wage).toEqual(15);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        query {\n            getSalary(id: \"" + req.data.createSalary.id + "\") {\n                id\n                wage\n            }\n        }\n        ")];
            case 2:
                req2 = _a.sent();
                expect(req2.data.getSalary.id).toEqual(req.data.createSalary.id);
                expect(req2.data.getSalary.wage).toEqual(15);
                return [3 /*break*/, 4];
            case 3:
                e_17 = _a.sent();
                console.error(e_17);
                expect(e_17).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test("Test getSalary w/ Admin group protection not authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, req2, e_18;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createSalary(input: { wage: 16 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSalary.id).toBeDefined();
                expect(req.data.createSalary.wage).toEqual(16);
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("\n        query {\n            getSalary(id: \"" + req.data.createSalary.id + "\") {\n                id\n                wage\n            }\n        }\n        ")];
            case 2:
                req2 = _a.sent();
                expect(req2.data.getSalary).toEqual(null);
                expect(req2.errors.length).toEqual(1);
                expect(req2.errors[0].errorType).toEqual('Unauthorized');
                return [3 /*break*/, 4];
            case 3:
                e_18 = _a.sent();
                console.error(e_18);
                expect(e_18).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test("Test listSalary w/ Admin group protection authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, req2, e_19;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createSalary(input: { wage: 101 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSalary.id).toBeDefined();
                expect(req.data.createSalary.wage).toEqual(101);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        query {\n            listSalary(filter: { wage: { eq: 101 }}) {\n                items {\n                    id\n                    wage\n                }\n            }\n        }\n        ")];
            case 2:
                req2 = _a.sent();
                expect(req2.data.listSalary.items.length).toEqual(1);
                expect(req2.data.listSalary.items[0].id).toEqual(req.data.createSalary.id);
                expect(req2.data.listSalary.items[0].wage).toEqual(101);
                return [3 /*break*/, 4];
            case 3:
                e_19 = _a.sent();
                console.error(e_19);
                expect(e_19).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
test("Test listSalary w/ Admin group protection not authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, req2, e_20;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createSalary(input: { wage: 102 }) {\n                id\n                wage\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSalary.id).toBeDefined();
                expect(req.data.createSalary.wage).toEqual(102);
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("\n        query {\n            listSalary(filter: { wage: { eq: 102 }}) {\n                items {\n                    id\n                    wage\n                }\n            }\n        }\n        ")];
            case 2:
                req2 = _a.sent();
                expect(req2.data.listSalary).toEqual(null);
                expect(req2.errors.length).toEqual(1);
                expect(req2.errors[0].errorType).toEqual('Unauthorized');
                return [3 /*break*/, 4];
            case 3:
                e_20 = _a.sent();
                console.error(e_20);
                expect(e_20).toBeUndefined();
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * Dynamic Group Auth
 */
test("Test createManyGroupProtected w/ dynamic group protection authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, e_21;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createManyGroupProtected(input: { value: 10, groups: [\"Admin\"] }) {\n                id\n                value\n                groups\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createManyGroupProtected.id).toBeDefined();
                expect(req.data.createManyGroupProtected.value).toEqual(10);
                expect(req.data.createManyGroupProtected.groups).toEqual(["Admin"]);
                return [3 /*break*/, 3];
            case 2:
                e_21 = _a.sent();
                console.error(e_21);
                expect(e_21).toBeUndefined();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
test("Test createManyGroupProtected w/ dynamic group protection when not authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, e_22;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("\n        mutation {\n            createManyGroupProtected(input: { value: 10, groups: [\"Admin\"] }) {\n                id\n                value\n                groups\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createManyGroupProtected).toEqual(null);
                expect(req.errors.length).toEqual(1);
                expect(req.errors[0].errorType).toEqual('Unauthorized');
                return [3 /*break*/, 3];
            case 2:
                e_22 = _a.sent();
                console.error(e_22);
                expect(e_22).toBeUndefined();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
test("Test createSingleGroupProtected w/ dynamic group protection authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, e_23;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, GRAPHQL_CLIENT_1.query("\n        mutation {\n            createSingleGroupProtected(input: { value: 10, group: \"Admin\" }) {\n                id\n                value\n                group\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSingleGroupProtected.id).toBeDefined();
                expect(req.data.createSingleGroupProtected.value).toEqual(10);
                expect(req.data.createSingleGroupProtected.group).toEqual("Admin");
                return [3 /*break*/, 3];
            case 2:
                e_23 = _a.sent();
                console.error(e_23);
                expect(e_23).toBeUndefined();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
test("Test createSingleGroupProtected w/ dynamic group protection when not authorized", function () { return __awaiter(_this, void 0, void 0, function () {
    var req, e_24;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, GRAPHQL_CLIENT_2.query("\n        mutation {\n            createSingleGroupProtected(input: { value: 10, group: \"Admin\" }) {\n                id\n                value\n                group\n            }\n        }\n        ")];
            case 1:
                req = _a.sent();
                console.log(JSON.stringify(req, null, 4));
                expect(req.data.createSingleGroupProtected).toEqual(null);
                expect(req.errors.length).toEqual(1);
                expect(req.errors[0].errorType).toEqual('Unauthorized');
                return [3 /*break*/, 3];
            case 2:
                e_24 = _a.sent();
                console.error(e_24);
                expect(e_24).toBeUndefined();
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
//# sourceMappingURL=AppSyncAuthTransformer.e2e.test.js.map