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
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var amplify_cli_core_1 = require("amplify-cli-core");
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var functionTester_1 = require("../schema-api-directives/functionTester");
var import_helpers_1 = require("../import-helpers");
var profileName = 'amplify-integ-test-user';
describe('s3 import', function () {
    var projectPrefix = 'sssimp';
    var ogProjectPrefix = 'ogsssimp';
    var projectSettings = {
        name: projectPrefix,
    };
    var ogProjectSettings = {
        name: ogProjectPrefix,
    };
    var dummyOGProjectSettings = {
        name: 'dummyog1',
    };
    // OG is the CLI project that creates the s3 bucket to import by other test projects
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
                    ogSettings = (0, import_helpers_1.createStorageSettings)(ogProjectSettings.name, ogShortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(ogProjectRoot, ogProjectSettings)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(ogProjectRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addS3StorageWithSettings)(ogProjectRoot, ogSettings)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(ogProjectRoot)];
                case 5:
                    _a.sent();
                    ogProjectDetails = (0, import_helpers_1.getOGStorageProjectDetails)(ogProjectRoot);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(dummyOGProjectSettings.name)];
                case 6:
                    dummyOGProjectRoot = _a.sent();
                    dummyOGShortId = (0, import_helpers_1.getShortId)();
                    dummyOGSettings = (0, import_helpers_1.createStorageSettings)(dummyOGProjectSettings.name, ogShortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(dummyOGProjectRoot, dummyOGProjectSettings)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(dummyOGProjectRoot)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addS3StorageWithSettings)(dummyOGProjectRoot, dummyOGSettings)];
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
    it('status should reflect correct values for imported storage', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectDetails;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importS3)(projectRoot, ogSettings.bucketName)];
                case 3:
                    _a.sent();
                    projectDetails = (0, import_helpers_1.getStorageProjectDetails)(projectRoot);
                    (0, import_helpers_1.expectStorageProjectDetailsMatch)(projectDetails, ogProjectDetails);
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
                    projectDetails = (0, import_helpers_1.getStorageProjectDetails)(projectRoot);
                    (0, import_helpers_1.expectStorageProjectDetailsMatch)(projectDetails, ogProjectDetails);
                    return [4 /*yield*/, (0, import_helpers_1.removeImportedS3WithDefault)(projectRoot)];
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
    it('imported storage with function and crud on storage should push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, storageResourceName, projectDetails, amplifyBackendDirPath, functionFilePath, amplifyFunctionIndexFilePath, s3ResourceNameUpperCase, s3EnvVarName, indexjsContents, rootStack, functionResourceName, bucketNameParameterName, functionResource, functionStackFilePath, functionStack;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _k.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _k.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importS3)(projectRoot, ogSettings.bucketName)];
                case 3:
                    _k.sent();
                    functionName = (0, functionTester_1.randomizedFunctionName)('s3impfunc');
                    storageResourceName = (0, import_helpers_1.getS3ResourceName)(projectRoot);
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
                    _k.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 5:
                    _k.sent();
                    projectDetails = (0, import_helpers_1.getStorageProjectDetails)(projectRoot);
                    amplifyBackendDirPath = path.join(projectRoot, 'amplify', 'backend');
                    functionFilePath = path.join(amplifyBackendDirPath, 'function', functionName);
                    amplifyFunctionIndexFilePath = path.join(functionFilePath, 'src', 'index.js');
                    s3ResourceNameUpperCase = projectDetails.storageResourceName.toUpperCase();
                    s3EnvVarName = "STORAGE_".concat(s3ResourceNameUpperCase, "_BUCKETNAME");
                    indexjsContents = fs.readFileSync(amplifyFunctionIndexFilePath).toString();
                    expect(indexjsContents.indexOf(s3EnvVarName)).toBeGreaterThanOrEqual(0);
                    rootStack = (0, import_helpers_1.readRootStack)(projectRoot);
                    functionResourceName = "function".concat(functionName);
                    bucketNameParameterName = "storage".concat(projectDetails.storageResourceName, "BucketName");
                    functionResource = rootStack.Resources[functionResourceName];
                    expect((_a = functionResource.Properties) === null || _a === void 0 ? void 0 : _a.Parameters[bucketNameParameterName]).toEqual(projectDetails.meta.BucketName);
                    functionStackFilePath = path.join(functionFilePath, "".concat(functionName, "-cloudformation-template.json"));
                    functionStack = amplify_cli_core_1.JSONUtilities.readJson(functionStackFilePath);
                    expect((_e = (_d = (_c = (_b = functionStack.Resources) === null || _b === void 0 ? void 0 : _b.LambdaFunction) === null || _c === void 0 ? void 0 : _c.Properties) === null || _d === void 0 ? void 0 : _d.Environment) === null || _e === void 0 ? void 0 : _e.Variables[s3EnvVarName].Ref).toEqual(bucketNameParameterName);
                    // Verify if generated policy has the userpool id as resource
                    expect((_j = (_h = (_g = (_f = functionStack.Resources) === null || _f === void 0 ? void 0 : _f.AmplifyResourcesPolicy) === null || _g === void 0 ? void 0 : _g.Properties) === null || _h === void 0 ? void 0 : _h.PolicyDocument) === null || _j === void 0 ? void 0 : _j.Statement[0].Resource[0]['Fn::Join'][1][1].Ref).toEqual(bucketNameParameterName);
                    return [2 /*return*/];
            }
        });
    }); });
    it('imported storage, push, pull to empty directory, files should match', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, storageResourceName, appId, projectRootPull;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, __assign(__assign({}, projectSettings), { disableAmplifyAppCreation: false }))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importS3)(projectRoot, ogSettings.bucketName)];
                case 3:
                    _a.sent();
                    functionName = (0, functionTester_1.randomizedFunctionName)('s3impfunc');
                    storageResourceName = (0, import_helpers_1.getS3ResourceName)(projectRoot);
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
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('s3import-pull')];
                case 7:
                    projectRootPull = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(projectRootPull, { override: false, emptyDir: true, appId: appId })];
                case 8:
                    _a.sent();
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projectRoot);
                    (0, import_helpers_1.expectLocalAndPulledBackendConfigMatching)(projectRoot, projectRootPull);
                    (0, import_helpers_1.expectS3LocalAndOGMetaFilesOutputMatching)(projectRoot, projectRootPull);
                    return [3 /*break*/, 10];
                case 9:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRootPull);
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=import_s3_1.test.js.map