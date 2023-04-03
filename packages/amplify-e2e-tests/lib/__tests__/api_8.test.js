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
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs_1 = require("fs");
var path = __importStar(require("path"));
describe('amplify add api (REST and GRAPHQL)', function () {
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
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projRoot)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('adds a rest api and then adds a path to the existing api', function () { return __awaiter(void 0, void 0, void 0, function () {
        var apisDirectory, apis, apiName, apiDirectory, cfnTemplateFile, cfnTemplate;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World' }, 'nodejs')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, { existingLambda: true })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addRestApi)(projRoot, { isFirstRestApi: false, existingLambda: true, path: '/newpath' })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot)];
                case 5:
                    _a.sent();
                    (0, amplify_e2e_core_1.validateRestApiMeta)(projRoot);
                    apisDirectory = path.join(projRoot, 'amplify', 'backend', 'api');
                    apis = (0, fs_1.readdirSync)(apisDirectory);
                    apiName = apis[0];
                    apiDirectory = path.join(apisDirectory, apiName);
                    cfnTemplateFile = path.join(apiDirectory, 'build', "".concat(apiName, "-cloudformation-template.json"));
                    cfnTemplate = JSON.parse((0, fs_1.readFileSync)(cfnTemplateFile, 'utf8'));
                    // The ApiId output is required
                    expect(cfnTemplate.Outputs.ApiId).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    it('amplify push prompt for cognito configuration if auth mode is missing', function () { return __awaiter(void 0, void 0, void 0, function () {
        var envName, projName, meta, region, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    envName = 'devtest';
                    projName = 'lambdaauthmode';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projName, envName: envName })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'useexperimentalpipelinedtransformer', true)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'transformerversion', 2)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World' }, 'nodejs')];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projName, 'cognito_simple_model.graphql')];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushGraphQlWithCognitoPrompt)(projRoot)];
                case 7:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    region = meta.providers.awscloudformation.Region;
                    output = meta.api.lambdaauthmode.output;
                    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput, GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, region)];
                case 8:
                    graphqlApi = (_a.sent()).graphqlApi;
                    expect(GraphQLAPIIdOutput).toBeDefined();
                    expect(GraphQLAPIEndpointOutput).toBeDefined();
                    expect(GraphQLAPIKeyOutput).toBeDefined();
                    expect(graphqlApi).toBeDefined();
                    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    (0, amplify_e2e_core_1.validateRestApiMeta)(projRoot, meta);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=api_8.test.js.map