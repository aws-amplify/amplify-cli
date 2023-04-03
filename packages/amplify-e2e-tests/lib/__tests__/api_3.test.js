"use strict";
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
var fs_1 = require("fs");
var fs_extra_1 = require("fs-extra");
var graphql_transformer_core_1 = require("graphql-transformer-core");
var lodash_1 = __importDefault(require("lodash"));
var path_1 = __importDefault(require("path"));
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
                    metaFilePath = path_1.default.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
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
    it('init a project and add the simple_model api, change transformer version to base version and push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var name, transformConfig, apiRoot, meta, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    name = "simplemodelv".concat(graphql_transformer_core_1.TRANSFORM_BASE_VERSION);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: name })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, name, 'simple_model.graphql')];
                case 3:
                    _a.sent();
                    transformConfig = (0, amplify_e2e_core_1.getTransformConfig)(projRoot, name);
                    expect(transformConfig).toBeDefined();
                    expect(transformConfig.Version).toBeDefined();
                    expect(transformConfig.Version).toEqual(graphql_transformer_core_1.TRANSFORM_CURRENT_VERSION);
                    transformConfig.Version = graphql_transformer_core_1.TRANSFORM_BASE_VERSION;
                    apiRoot = path_1.default.join(projRoot, 'amplify', 'backend', 'api', name);
                    (0, graphql_transformer_core_1.writeTransformerConfiguration)(apiRoot, transformConfig);
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
                    return [2 /*return*/];
            }
        });
    }); });
    var addApiRequest = {
        version: 1,
        serviceConfiguration: {
            serviceName: 'AppSync',
            apiName: 'myApiName',
            transformSchema: (0, fs_extra_1.readFileSync)((0, amplify_e2e_core_1.getSchemaPath)('simple_model.graphql'), 'utf8'),
            defaultAuthType: {
                mode: 'API_KEY',
            },
        },
    };
    it('creates AppSync API in headless mode', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addHeadlessApi)(projRoot, addApiRequest)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'transformerVersion', 1)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 5:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    output = meta.api.myApiName.output;
                    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput, GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region)];
                case 6:
                    graphqlApi = (_a.sent()).graphqlApi;
                    expect(GraphQLAPIIdOutput).toBeDefined();
                    expect(GraphQLAPIEndpointOutput).toBeDefined();
                    expect(GraphQLAPIKeyOutput).toBeDefined();
                    expect(graphqlApi).toBeDefined();
                    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    return [2 /*return*/];
            }
        });
    }); });
    var newSchema = (0, fs_extra_1.readFileSync)((0, amplify_e2e_core_1.getSchemaPath)('two-model-schema.graphql'), 'utf8');
    var updateApiRequest = {
        version: 1,
        serviceModification: {
            serviceName: 'AppSync',
            transformSchema: newSchema,
            defaultAuthType: {
                mode: 'AWS_IAM',
            },
            additionalAuthTypes: [
                {
                    mode: 'API_KEY',
                },
            ],
            conflictResolution: {
                defaultResolutionStrategy: {
                    type: 'OPTIMISTIC_CONCURRENCY',
                },
            },
        },
    };
    it('updates AppSync API in headless mode', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addHeadlessApi)(projRoot, addApiRequest)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'transformerVersion', 1)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateHeadlessApi)(projRoot, updateApiRequest, true)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot, undefined, undefined, true)];
                case 7:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    output = meta.api.myApiName.output;
                    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput, GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region)];
                case 8:
                    graphqlApi = (_a.sent()).graphqlApi;
                    expect(GraphQLAPIIdOutput).toBeDefined();
                    expect(GraphQLAPIEndpointOutput).toBeDefined();
                    expect(GraphQLAPIKeyOutput).toBeDefined();
                    expect(graphqlApi).toBeDefined();
                    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    expect((0, amplify_e2e_core_1.getTransformConfig)(projRoot, 'myApiName')).toMatchSnapshot();
                    expect(output.authConfig).toMatchSnapshot();
                    expect((0, amplify_e2e_core_1.getProjectSchema)(projRoot, 'myApiName')).toMatchSnapshot();
                    return [2 /*return*/];
            }
        });
    }); });
    it('removes AppSync API in headless mode', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi, newMeta, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addHeadlessApi)(projRoot, addApiRequest)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'transformerVersion', 1)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', false)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 5:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    output = meta.api.myApiName.output;
                    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput, GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region)];
                case 6:
                    graphqlApi = (_a.sent()).graphqlApi;
                    expect(GraphQLAPIIdOutput).toBeDefined();
                    expect(GraphQLAPIEndpointOutput).toBeDefined();
                    expect(GraphQLAPIKeyOutput).toBeDefined();
                    expect(graphqlApi).toBeDefined();
                    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeHeadlessApi)(projRoot, 'myApiName')];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot)];
                case 8:
                    _a.sent();
                    newMeta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    expect(lodash_1.default.isEmpty(newMeta.api)).toBe(true);
                    _a.label = 9;
                case 9:
                    _a.trys.push([9, 11, , 12]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region)];
                case 10:
                    _a.sent();
                    expect(true).toBe(false); // expecting failure
                    return [3 /*break*/, 12];
                case 11:
                    err_1 = _a.sent();
                    expect(err_1.message).toBe("GraphQL API ".concat(GraphQLAPIIdOutput, " not found."));
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=api_3.test.js.map