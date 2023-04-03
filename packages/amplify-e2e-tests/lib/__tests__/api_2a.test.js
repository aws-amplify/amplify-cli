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
var aws_appsync_1 = __importStar(require("aws-appsync"));
var fs_1 = require("fs");
var graphql_tag_1 = __importDefault(require("graphql-tag"));
var graphql_transformer_core_1 = require("graphql-transformer-core");
var lodash_1 = __importDefault(require("lodash"));
var path = __importStar(require("path"));
var providerName = 'awscloudformation';
// to deal with bug in cognito-identity-js
global.fetch = require('node-fetch');
// to deal with subscriptions in node env
global.WebSocket = require('ws');
describe('amplify add api (GraphQL)', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('graphql-api')];
                case 1:
                    projRoot = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var metaFilePath;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
                    if (!(0, fs_1.existsSync)(metaFilePath)) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project with conflict detection enabled and a schema with @key, test update mutation', function () { return __awaiter(void 0, void 0, void 0, function () {
        var name, meta, region, output, url, apiKey, appSyncClient, createMutation, createInput, createResult, updateMutation, createResultData, updateInput, updateResult, updateResultData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = 'keyconflictdetection';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: name })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithBlankSchemaAndConflictDetection)(projRoot, { transformerVersion: 1 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, name, 'key-conflict-detection.graphql')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    region = meta.providers[providerName].Region;
                    output = meta.api[name].output;
                    url = output.GraphQLAPIEndpointOutput;
                    apiKey = output.GraphQLAPIKeyOutput;
                    appSyncClient = new aws_appsync_1.default({
                        url: url,
                        region: region,
                        disableOffline: true,
                        auth: {
                            type: aws_appsync_1.AUTH_TYPE.API_KEY,
                            apiKey: apiKey,
                        },
                    });
                    createMutation = "\n      mutation CreateNote($input: CreateNoteInput!, $condition: ModelNoteConditionInput) {\n        createNote(input: $input, condition: $condition) {\n          noteId\n          note\n          _version\n          _deleted\n          _lastChangedAt\n          createdAt\n          updatedAt\n        }\n      }\n    ";
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
                case 5:
                    createResult = _a.sent();
                    updateMutation = "\n      mutation UpdateNote($input: UpdateNoteInput!, $condition: ModelNoteConditionInput) {\n        updateNote(input: $input, condition: $condition) {\n          noteId\n          note\n          _version\n          _deleted\n          _lastChangedAt\n          createdAt\n          updatedAt\n        }\n      }\n    ";
                    createResultData = createResult.data;
                    updateInput = {
                        input: {
                            noteId: createResultData.createNote.noteId,
                            note: 'note updated',
                            _version: createResultData.createNote._version,
                        },
                    };
                    return [4 /*yield*/, appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(updateMutation),
                            fetchPolicy: 'no-cache',
                            variables: updateInput,
                        })];
                case 6:
                    updateResult = _a.sent();
                    updateResultData = updateResult.data;
                    expect(updateResultData).toBeDefined();
                    expect(updateResultData.updateNote).toBeDefined();
                    expect(updateResultData.updateNote.noteId).toEqual(createResultData.createNote.noteId);
                    expect(updateResultData.updateNote.note).not.toEqual(createResultData.createNote.note);
                    expect(updateResultData.updateNote._version).not.toEqual(createResultData.createNote._version);
                    expect(updateResultData.updateNote.note).toEqual(updateInput.input.note);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project with conflict detection enabled and toggle disable', function () { return __awaiter(void 0, void 0, void 0, function () {
        var name, meta, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi, transformConfig, disableDSConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = 'conflictdetection';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: name })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithBlankSchemaAndConflictDetection)(projRoot, { transformerVersion: 1 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, name, 'simple_model.graphql')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    output = meta.api[name].output;
                    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput, GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region)];
                case 5:
                    graphqlApi = (_a.sent()).graphqlApi;
                    expect(GraphQLAPIIdOutput).toBeDefined();
                    expect(GraphQLAPIEndpointOutput).toBeDefined();
                    expect(GraphQLAPIKeyOutput).toBeDefined();
                    expect(graphqlApi).toBeDefined();
                    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    transformConfig = (0, amplify_e2e_core_1.getTransformConfig)(projRoot, name);
                    expect(transformConfig).toBeDefined();
                    expect(transformConfig.Version).toBeDefined();
                    expect(transformConfig.Version).toEqual(graphql_transformer_core_1.TRANSFORM_CURRENT_VERSION);
                    expect(transformConfig.ResolverConfig).toBeDefined();
                    expect(transformConfig.ResolverConfig.project).toBeDefined();
                    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
                    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');
                    // remove DataStore feature
                    return [4 /*yield*/, (0, amplify_e2e_core_1.apiDisableDataStore)(projRoot, {})];
                case 6:
                    // remove DataStore feature
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot, undefined, false, false, 1000 * 60 * 45 /* 45 minutes */)];
                case 7:
                    _a.sent();
                    disableDSConfig = (0, amplify_e2e_core_1.getTransformConfig)(projRoot, name);
                    expect(disableDSConfig).toBeDefined();
                    expect(lodash_1.default.isEmpty(disableDSConfig.ResolverConfig)).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=api_2a.test.js.map