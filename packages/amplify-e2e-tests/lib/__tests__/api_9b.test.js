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
var path_1 = __importDefault(require("path"));
var fs_1 = require("fs");
describe('amplify add api (GraphQL)', function () {
    var projRoot;
    var projFolderName;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projFolderName = "graphqlApi".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(projFolderName)];
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
    it('init a project with a simple model , add a function and removes the dependent @model', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectName, nextSchema, initialSchema, fnName, meta, region, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi, tableName, error, table, ex_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectName = "simplemodel".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    nextSchema = 'initial_key_blog.graphql';
                    initialSchema = 'two-model-schema.graphql';
                    fnName = "integtestfn".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projectName })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, initialSchema)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            name: fnName,
                            functionTemplate: 'Hello World',
                            additionalPermissions: {
                                permissions: ['storage'],
                                choices: ['api', 'storage'],
                                resources: ['Comment:@model(appsync)'],
                                resourceChoices: ['Post:@model(appsync)', 'Comment:@model(appsync)'],
                                operations: ['read'],
                            },
                        }, 'nodejs')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 5:
                    _a.sent();
                    (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, nextSchema);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdateForDependentModel)(projRoot, undefined, true)];
                case 6:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    region = meta.providers.awscloudformation.Region;
                    output = meta.api[projectName].output;
                    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput, GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
                    expect(GraphQLAPIIdOutput).toBeDefined();
                    expect(GraphQLAPIEndpointOutput).toBeDefined();
                    expect(GraphQLAPIKeyOutput).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, region)];
                case 7:
                    graphqlApi = (_a.sent()).graphqlApi;
                    expect(graphqlApi).toBeDefined();
                    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    tableName = "Comment-".concat(GraphQLAPIIdOutput, "-integtest");
                    error = { message: null };
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getDDBTable)(tableName, region)];
                case 9:
                    table = _a.sent();
                    expect(table).toBeUndefined();
                    return [3 /*break*/, 11];
                case 10:
                    ex_1 = _a.sent();
                    Object.assign(error, ex_1);
                    return [3 /*break*/, 11];
                case 11:
                    expect(error).toBeDefined();
                    expect(error.message).toContain("".concat(tableName, " not found"));
                    return [2 /*return*/];
            }
        });
    }); });
    it('api force push with no changes', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectName, meta, beforeDirHash, afterDirHash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectName = "apinochange".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projectName })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, 'two-model-schema.graphql')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                    beforeDirHash = meta.api[projectName].lastPushDirHash;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushForce)(projRoot)];
                case 5:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                    afterDirHash = meta.api[projectName].lastPushDirHash;
                    expect(beforeDirHash).toBe(afterDirHash);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=api_9b.test.js.map