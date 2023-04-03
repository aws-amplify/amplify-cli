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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var graphql_tag_1 = __importDefault(require("graphql-tag"));
var aws_appsync_1 = __importStar(require("aws-appsync"));
global.fetch = require('node-fetch');
jest.setTimeout(120 * 60 * 1000); // Set timeout to 2 hour because of creating/deleting searchable instance
describe('transformer model searchable migration test', function () {
    var projRoot;
    var projectName;
    var appSyncClient;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectName = (0, amplify_e2e_core_1.createRandomName)();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)((0, amplify_e2e_core_1.createRandomName)())];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {
                            name: projectName,
                        })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!process.env.CIRCLECI) return [3 /*break*/, 1];
                    console.log('Skipping cloud deletion since we are in CI, and cleanup script will delete this stack in cleanup step.');
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
                    return [3 /*break*/, 3];
                case 1: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 2:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    }); });
    it('migration of searchable directive - search should return expected results', function () { return __awaiter(void 0, void 0, void 0, function () {
        var v1Schema, v2Schema;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    v1Schema = 'transformer_migration/searchable-v1.graphql';
                    v2Schema = 'transformer_migration/searchable-v2.graphql';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { apiName: projectName, transformerVersion: 1 })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, v1Schema)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 3:
                    _a.sent();
                    appSyncClient = getAppSyncClientFromProj(projRoot);
                    return [4 /*yield*/, runAndValidateQuery('test1', 'test1', 10)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'transformerVersion', 2)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', true)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, v2Schema)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot)];
                case 8:
                    _a.sent();
                    appSyncClient = getAppSyncClientFromProj(projRoot);
                    return [4 /*yield*/, runAndValidateQuery('test2', 'test2', 10)];
                case 9:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    var getAppSyncClientFromProj = function (projRoot) {
        var meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
        var region = meta.providers.awscloudformation.Region;
        var output = meta.api[projectName].output;
        var url = output.GraphQLAPIEndpointOutput;
        var apiKey = output.GraphQLAPIKeyOutput;
        return new aws_appsync_1.default({
            url: url,
            region: region,
            disableOffline: true,
            auth: {
                type: aws_appsync_1.AUTH_TYPE.API_KEY,
                apiKey: apiKey,
            },
        });
    };
    var fragments = ["fragment FullTodo on Todo { id name description count }"];
    var runMutation = function (query) { return __awaiter(void 0, void 0, void 0, function () {
        var q, response, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    q = __spreadArray([query], fragments, true).join('\n');
                    return [4 /*yield*/, appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(q),
                            fetchPolicy: 'no-cache',
                        })];
                case 1:
                    response = _a.sent();
                    return [2 /*return*/, response];
                case 2:
                    e_1 = _a.sent();
                    console.error(e_1);
                    return [2 /*return*/, null];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var createEntry = function (name, description, count) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, runMutation(getCreateTodosMutation(name, description, count))];
            case 1: return [2 /*return*/, _a.sent()];
        }
    }); }); };
    function getCreateTodosMutation(name, description, count) {
        return "mutation {\n          createTodo(input: {\n              name: \"".concat(name, "\"\n              description: \"").concat(description, "\"\n              count: ").concat(count, "\n          }) { ...FullTodo }\n      }");
    }
    var runAndValidateQuery = function (name, description, count) { return __awaiter(void 0, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createEntry(name, description, count)];
                case 1:
                    response = _a.sent();
                    expect(response).toBeDefined();
                    expect(response.errors).toBeUndefined();
                    expect(response.data).toBeDefined();
                    expect(response.data.createTodo).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); };
});
//# sourceMappingURL=searchable-migration.test.js.map