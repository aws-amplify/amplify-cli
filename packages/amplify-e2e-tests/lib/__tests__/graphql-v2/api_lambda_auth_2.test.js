"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var graphql_tag_1 = __importDefault(require("graphql-tag"));
var aws_appsync_1 = __importStar(require("aws-appsync"));
// to deal with bug in cognito-identity-js
global.fetch = require('node-fetch');
// to deal with subscriptions in node env
global.WebSocket = require('ws');
describe('amplify add api (GraphQL) - Lambda Authorizer', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('rest-api')];
                case 1:
                    projRoot = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, _a, authRoleArn, unauthRoleArn, bucketName, region, stackId, bucketExists, seenAtLeastOneFunc, _i, _b, key, _c, service, build, lastBuildTimeStamp, lastPackageTimeStamp, distZipFilename, lastPushTimeStamp, lastPushDirHash;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(meta.providers.awscloudformation).toBeDefined();
                    _a = meta.providers.awscloudformation, authRoleArn = _a.AuthRoleArn, unauthRoleArn = _a.UnauthRoleArn, bucketName = _a.DeploymentBucketName, region = _a.Region, stackId = _a.StackId;
                    expect(authRoleArn).toBeDefined();
                    expect(unauthRoleArn).toBeDefined();
                    expect(region).toBeDefined();
                    expect(stackId).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.checkIfBucketExists)(bucketName, region)];
                case 1:
                    bucketExists = _d.sent();
                    expect(bucketExists).toMatchObject({});
                    expect(meta.function).toBeDefined();
                    seenAtLeastOneFunc = false;
                    for (_i = 0, _b = Object.keys(meta.function); _i < _b.length; _i++) {
                        key = _b[_i];
                        _c = meta.function[key], service = _c.service, build = _c.build, lastBuildTimeStamp = _c.lastBuildTimeStamp, lastPackageTimeStamp = _c.lastPackageTimeStamp, distZipFilename = _c.distZipFilename, lastPushTimeStamp = _c.lastPushTimeStamp, lastPushDirHash = _c.lastPushDirHash;
                        expect(service).toBe('Lambda');
                        expect(build).toBeTruthy();
                        expect(lastBuildTimeStamp).toBeDefined();
                        expect(lastPackageTimeStamp).toBeDefined();
                        expect(distZipFilename).toBeDefined();
                        expect(lastPushTimeStamp).toBeDefined();
                        expect(lastPushDirHash).toBeDefined();
                        seenAtLeastOneFunc = true;
                    }
                    expect(seenAtLeastOneFunc).toBeTruthy();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 2:
                    _d.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('lambda auth must fail when missing read access on a field or invalid token', function () { return __awaiter(void 0, void 0, void 0, function () {
        var envName, projName, meta, region, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi, url, apiKey, appSyncClient, createMutation, createInput, createResult, listNotesQuery, appSyncInvalidClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    envName = 'devtest';
                    projName = 'lambdaauthmodeerr';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projName, envName: envName })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithAllAuthModes)(projRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projName, 'lambda-auth-field-auth-1-v2.graphql')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    region = meta.providers.awscloudformation.Region;
                    output = meta.api.lambdaauthmodeerr.output;
                    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput, GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, region)];
                case 5:
                    graphqlApi = (_a.sent()).graphqlApi;
                    expect(GraphQLAPIIdOutput).toBeDefined();
                    expect(GraphQLAPIEndpointOutput).toBeDefined();
                    expect(GraphQLAPIKeyOutput).toBeDefined();
                    expect(graphqlApi).toBeDefined();
                    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    url = GraphQLAPIEndpointOutput;
                    apiKey = GraphQLAPIKeyOutput;
                    appSyncClient = new aws_appsync_1.default({
                        url: url,
                        region: region,
                        disableOffline: true,
                        auth: {
                            type: aws_appsync_1.AUTH_TYPE.AWS_LAMBDA,
                            token: 'custom-authorized',
                        },
                    });
                    createMutation = "\n      mutation CreateNote($input: CreateNoteInput!, $condition: ModelNoteConditionInput) {\n        createNote(input: $input, condition: $condition) {\n          noteId\n        }\n      }\n    ";
                    createInput = {
                        input: {
                            noteId: '1',
                            note: 'initial note',
                        },
                    };
                    return [4 /*yield*/, appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(createMutation),
                            fetchPolicy: 'no-cache',
                            variables: createInput,
                        })];
                case 6:
                    createResult = _a.sent();
                    listNotesQuery = "\n      query ListNotes {\n        listNotes {\n          items {\n            noteId\n            note\n          }\n        }\n      }\n    ";
                    return [4 /*yield*/, expect(appSyncClient.query({
                            query: (0, graphql_tag_1.default)(listNotesQuery),
                            fetchPolicy: 'no-cache',
                        })).rejects.toThrow("GraphQL error: Not Authorized to access note on type")];
                case 7:
                    _a.sent();
                    appSyncInvalidClient = new aws_appsync_1.default({
                        url: url,
                        region: region,
                        disableOffline: true,
                        auth: {
                            type: aws_appsync_1.AUTH_TYPE.AWS_LAMBDA,
                            token: 'invalid-token',
                        },
                    });
                    return [4 /*yield*/, expect(appSyncInvalidClient.query({
                            query: (0, graphql_tag_1.default)(listNotesQuery),
                            fetchPolicy: 'no-cache',
                        })).rejects.toThrow("Network error: Response not successful: Received status code 401")];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('lambda auth with no create access', function () { return __awaiter(void 0, void 0, void 0, function () {
        var envName, projName, meta, region, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi, url, appSyncClient, createMutation, createInput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    envName = 'devtest';
                    projName = 'lambdaauth2';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projName, envName: envName })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithAllAuthModes)(projRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projName, 'lambda-auth-field-auth-2-v2.graphql')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    region = meta.providers.awscloudformation.Region;
                    output = meta.api.lambdaauth2.output;
                    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput, GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, region)];
                case 5:
                    graphqlApi = (_a.sent()).graphqlApi;
                    expect(GraphQLAPIIdOutput).toBeDefined();
                    expect(GraphQLAPIEndpointOutput).toBeDefined();
                    expect(GraphQLAPIKeyOutput).toBeDefined();
                    expect(graphqlApi).toBeDefined();
                    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    url = GraphQLAPIEndpointOutput;
                    appSyncClient = new aws_appsync_1.default({
                        url: url,
                        region: region,
                        disableOffline: true,
                        auth: {
                            type: aws_appsync_1.AUTH_TYPE.AWS_LAMBDA,
                            token: 'custom-authorized',
                        },
                    });
                    createMutation = "\n      mutation CreateNote($input: CreateNoteInput!, $condition: ModelNoteConditionInput) {\n        createNote(input: $input, condition: $condition) {\n          noteId\n          note\n          createdAt\n          updatedAt\n        }\n      }\n    ";
                    createInput = {
                        input: {
                            noteId: '1',
                            note: 'initial note',
                        },
                    };
                    return [4 /*yield*/, expect(appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(createMutation),
                            fetchPolicy: 'no-cache',
                            variables: createInput,
                        })).rejects.toThrow("GraphQL error: Unauthorized on [note]")];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=api_lambda_auth_2.test.js.map