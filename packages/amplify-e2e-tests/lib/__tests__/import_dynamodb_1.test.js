"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var amplify_cli_core_1 = require("amplify-cli-core");
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var import_helpers_1 = require("../import-helpers");
var functionTester_1 = require("../schema-api-directives/functionTester");
describe('dynamodb import', function () {
    var projectPrefix = 'ddbimp';
    var ogProjectPrefix = 'ogddbimp';
    var projectSettings = {
        name: projectPrefix,
    };
    var ogProjectSettings = {
        name: ogProjectPrefix,
    };
    var dummyOGProjectSettings = {
        name: 'dummyog1',
    };
    // OG is the CLI project that creates the dynamodb tables to import by other test projects
    var ogProjectRoot;
    var ogShortId;
    var ogSettings;
    var ogProjectDetails;
    // We need an extra OG project to make sure that autocomplete prompt hits in
    var dummyOGProjectRoot;
    var dummyOGShortId;
    var dummyOGSettings;
    var projectRoot;
    var ignoreProjectDeleteErrors = false;
    beforeAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(ogProjectSettings.name)];
                case 1:
                    ogProjectRoot = _a.sent();
                    ogShortId = (0, import_helpers_1.getShortId)();
                    ogSettings = (0, import_helpers_1.createDynamoDBSettings)(ogProjectSettings.name, ogShortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(ogProjectRoot, ogProjectSettings)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(ogProjectRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addDynamoDBWithGSIWithSettings)(ogProjectRoot, ogSettings)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(ogProjectRoot)];
                case 5:
                    _a.sent();
                    ogProjectDetails = (0, import_helpers_1.getOGDynamoDBProjectDetails)(ogProjectRoot);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(dummyOGProjectSettings.name)];
                case 6:
                    dummyOGProjectRoot = _a.sent();
                    dummyOGShortId = (0, import_helpers_1.getShortId)();
                    dummyOGSettings = (0, import_helpers_1.createDynamoDBSettings)(dummyOGProjectSettings.name, dummyOGShortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(dummyOGProjectRoot, dummyOGProjectSettings)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(dummyOGProjectRoot)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addDynamoDBWithGSIWithSettings)(dummyOGProjectRoot, dummyOGSettings)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(dummyOGProjectRoot)];
                case 10:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(ogProjectRoot)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(ogProjectRoot);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(dummyOGProjectRoot)];
                case 2:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(dummyOGProjectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(projectPrefix)];
                case 1:
                    projectRoot = _a.sent();
                    ignoreProjectDeleteErrors = false;
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectRoot)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    // In some tests where project initialization fails it can lead to errors on cleanup which we
                    // can ignore if set by the test
                    if (!ignoreProjectDeleteErrors) {
                        throw error_1;
                    }
                    return [3 /*break*/, 3];
                case 3:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('status should reflect correct values for imported dynamodb table', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectDetails;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importDynamoDBTable)(projectRoot, ogSettings.tableName)];
                case 3:
                    _a.sent();
                    projectDetails = (0, import_helpers_1.getDynamoDBProjectDetails)(projectRoot);
                    (0, import_helpers_1.expectDynamoDBProjectDetailsMatch)(projectDetails, ogProjectDetails);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Import')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'No Change')];
                case 6:
                    _a.sent();
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projectRoot);
                    projectDetails = (0, import_helpers_1.getDynamoDBProjectDetails)(projectRoot);
                    (0, import_helpers_1.expectDynamoDBProjectDetailsMatch)(projectDetails, ogProjectDetails);
                    return [4 /*yield*/, (0, import_helpers_1.removeImportedDynamoDBWithDefault)(projectRoot)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Unlink')];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 9:
                    _a.sent();
                    (0, import_helpers_1.expectNoStorageInMeta)(projectRoot);
                    (0, import_helpers_1.expectLocalTeamInfoHasOnlyAuthCategoryAndNoStorage)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('imported dynamodb table with function and crud on storage should push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, storageResourceName, projectDetails, amplifyBackendDirPath, functionFilePath, amplifyFunctionIndexFilePath, dynamoDBResourceNameUpperCase, tableEnvVarName, arnEnvVarName, indexjsContents, rootStack, functionResourceName, tableNameParameterName, arnParameterName, functionResource, functionStackFilePath, functionStack;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
        return __generator(this, function (_t) {
            switch (_t.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _t.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _t.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importDynamoDBTable)(projectRoot, ogSettings.tableName)];
                case 3:
                    _t.sent();
                    functionName = (0, functionTester_1.randomizedFunctionName)('ddbimpfunc');
                    storageResourceName = (0, import_helpers_1.getDynamoDBResourceName)(projectRoot);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projectRoot, {
                            name: functionName,
                            functionTemplate: 'Hello World',
                            additionalPermissions: {
                                permissions: ['storage'],
                                choices: ['auth', 'storage'],
                                resources: [storageResourceName],
                                resourceChoices: [storageResourceName],
                                operations: ['create', 'read', 'update', 'delete'],
                            },
                        }, 'nodejs')];
                case 4:
                    _t.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 5:
                    _t.sent();
                    projectDetails = (0, import_helpers_1.getDynamoDBProjectDetails)(projectRoot);
                    amplifyBackendDirPath = path.join(projectRoot, 'amplify', 'backend');
                    functionFilePath = path.join(amplifyBackendDirPath, 'function', functionName);
                    amplifyFunctionIndexFilePath = path.join(functionFilePath, 'src', 'index.js');
                    dynamoDBResourceNameUpperCase = projectDetails.storageResourceName.toUpperCase();
                    tableEnvVarName = "STORAGE_".concat(dynamoDBResourceNameUpperCase, "_NAME");
                    arnEnvVarName = "STORAGE_".concat(dynamoDBResourceNameUpperCase, "_ARN");
                    indexjsContents = fs.readFileSync(amplifyFunctionIndexFilePath).toString();
                    expect(indexjsContents.indexOf(tableEnvVarName)).toBeGreaterThanOrEqual(0);
                    expect(indexjsContents.indexOf(arnEnvVarName)).toBeGreaterThanOrEqual(0);
                    rootStack = (0, import_helpers_1.readRootStack)(projectRoot);
                    functionResourceName = "function".concat(functionName);
                    tableNameParameterName = "storage".concat(projectDetails.storageResourceName.replace(/[\W_]+/g, ''), "Name");
                    arnParameterName = "storage".concat(projectDetails.storageResourceName.replace(/[\W_]+/g, ''), "Arn");
                    functionResource = rootStack.Resources[functionResourceName];
                    expect((_a = functionResource.Properties) === null || _a === void 0 ? void 0 : _a.Parameters[tableNameParameterName]).toEqual(projectDetails.meta.Name);
                    functionStackFilePath = path.join(functionFilePath, "".concat(functionName, "-cloudformation-template.json"));
                    functionStack = amplify_cli_core_1.JSONUtilities.readJson(functionStackFilePath);
                    expect((_e = (_d = (_c = (_b = functionStack.Resources) === null || _b === void 0 ? void 0 : _b.LambdaFunction) === null || _c === void 0 ? void 0 : _c.Properties) === null || _d === void 0 ? void 0 : _d.Environment) === null || _e === void 0 ? void 0 : _e.Variables[tableEnvVarName].Ref).toEqual(tableNameParameterName);
                    expect((_j = (_h = (_g = (_f = functionStack.Resources) === null || _f === void 0 ? void 0 : _f.LambdaFunction) === null || _g === void 0 ? void 0 : _g.Properties) === null || _h === void 0 ? void 0 : _h.Environment) === null || _j === void 0 ? void 0 : _j.Variables[arnEnvVarName].Ref).toEqual(arnParameterName);
                    // Verify if generated policy has the userpool id as resource
                    expect((_o = (_m = (_l = (_k = functionStack.Resources) === null || _k === void 0 ? void 0 : _k.AmplifyResourcesPolicy) === null || _l === void 0 ? void 0 : _l.Properties) === null || _m === void 0 ? void 0 : _m.PolicyDocument) === null || _o === void 0 ? void 0 : _o.Statement[0].Resource[0].Ref).toEqual(arnParameterName);
                    expect((_s = (_r = (_q = (_p = functionStack.Resources) === null || _p === void 0 ? void 0 : _p.AmplifyResourcesPolicy) === null || _q === void 0 ? void 0 : _q.Properties) === null || _r === void 0 ? void 0 : _r.PolicyDocument) === null || _s === void 0 ? void 0 : _s.Statement[0].Resource[1]['Fn::Join'][1][0].Ref).toEqual(arnParameterName);
                    return [2 /*return*/];
            }
        });
    }); });
    it('imported dynamodb table, push, pull to empty directory, files should match', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, storageResourceName, appId, projectRootPull;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, __assign(__assign({}, projectSettings), { disableAmplifyAppCreation: false }))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importDynamoDBTable)(projectRoot, ogSettings.tableName)];
                case 3:
                    _a.sent();
                    functionName = (0, functionTester_1.randomizedFunctionName)('ddbimpfunc');
                    storageResourceName = (0, import_helpers_1.getDynamoDBResourceName)(projectRoot);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projectRoot, {
                            name: functionName,
                            functionTemplate: 'Hello World',
                            additionalPermissions: {
                                permissions: ['storage'],
                                choices: ['auth', 'storage'],
                                resources: [storageResourceName],
                                resourceChoices: [storageResourceName],
                                operations: ['create', 'read', 'update', 'delete'],
                            },
                        }, 'nodejs')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 5:
                    _a.sent();
                    appId = (0, amplify_e2e_core_1.getAppId)(projectRoot);
                    expect(appId).toBeDefined();
                    _a.label = 6;
                case 6:
                    _a.trys.push([6, , 9, 10]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('ddbimport-pull')];
                case 7:
                    projectRootPull = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(projectRootPull, { override: false, emptyDir: true, appId: appId })];
                case 8:
                    _a.sent();
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projectRoot);
                    (0, import_helpers_1.expectLocalAndPulledBackendConfigMatching)(projectRoot, projectRootPull);
                    (0, import_helpers_1.expectDynamoDBLocalAndOGMetaFilesOutputMatching)(projectRoot, projectRootPull);
                    return [3 /*break*/, 10];
                case 9:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRootPull);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=import_dynamodb_1.test.js.map