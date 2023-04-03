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
var fs = __importStar(require("fs-extra"));
var path_1 = __importDefault(require("path"));
describe('amplify add api (GraphQL)', function () {
    var projRoot;
    var projFolderName;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    // eslint-disable-next-line spellcheck/spell-checker
                    projFolderName = 'graphqlapi';
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
                    if (!fs.existsSync(metaFilePath)) return [3 /*break*/, 2];
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
    it('init a project and add the simple_model api with transformer version 1', function () { return __awaiter(void 0, void 0, void 0, function () {
        var envName, projName, cliInputsFilePath, meta, region, output, GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput, graphqlApi, tableName, error, table, ex_1, srcOverrideFilePath, destOverrideFilePath, overriddenAppsyncApiOverride;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    envName = 'devtest';
                    projName = 'simplemodel';
                    cliInputsFilePath = path_1.default.join(projRoot, 'amplify', 'backend', 'api', "".concat(projName), 'cli-inputs.json');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projName, envName: envName })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projName, 'simple_model.graphql')];
                case 3:
                    _a.sent();
                    expect(fs.existsSync(cliInputsFilePath)).toBe(true);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    region = meta.providers.awscloudformation.Region;
                    output = meta.api.simplemodel.output;
                    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput, GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, region)];
                case 5:
                    graphqlApi = (_a.sent()).graphqlApi;
                    expect(GraphQLAPIIdOutput).toBeDefined();
                    expect(GraphQLAPIEndpointOutput).toBeDefined();
                    expect(GraphQLAPIKeyOutput).toBeDefined();
                    expect(graphqlApi).toBeDefined();
                    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    tableName = "AmplifyDataStore-".concat(graphqlApi.apiId, "-").concat(envName);
                    error = { message: null };
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getDDBTable)(tableName, region)];
                case 7:
                    table = _a.sent();
                    expect(table).toBeUndefined();
                    return [3 /*break*/, 9];
                case 8:
                    ex_1 = _a.sent();
                    Object.assign(error, ex_1);
                    return [3 /*break*/, 9];
                case 9:
                    expect(error).toBeDefined();
                    expect(error.message).toContain("".concat(tableName, " not found"));
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyOverrideApi)(projRoot)];
                case 10:
                    _a.sent();
                    srcOverrideFilePath = path_1.default.join(__dirname, '..', '..', 'overrides', 'override-api-gql.ts');
                    destOverrideFilePath = path_1.default.join(projRoot, 'amplify', 'backend', 'api', "".concat(projName), 'override.ts');
                    fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushOverride)(projRoot)];
                case 11:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getAppSyncApi)(GraphQLAPIIdOutput, region)];
                case 12:
                    overriddenAppsyncApiOverride = _a.sent();
                    expect(overriddenAppsyncApiOverride.graphqlApi).toBeDefined();
                    expect(overriddenAppsyncApiOverride.graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
                    // eslint-disable-next-line spellcheck/spell-checker
                    expect(overriddenAppsyncApiOverride.graphqlApi.xrayEnabled).toEqual(true);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=api_7.test.js.map