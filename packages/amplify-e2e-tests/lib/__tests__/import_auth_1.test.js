"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_cli_core_1 = require("amplify-cli-core");
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var fs = __importStar(require("fs-extra"));
var path = __importStar(require("path"));
var import_helpers_1 = require("../import-helpers");
var authHelper_1 = require("../schema-api-directives/authHelper");
var functionTester_1 = require("../schema-api-directives/functionTester");
describe('auth import userpool only', function () {
    // eslint-disable-next-line spellcheck/spell-checker
    var projectPrefix = 'auimpup';
    // eslint-disable-next-line spellcheck/spell-checker
    var ogProjectPrefix = 'ogauimpup';
    var projectSettings = {
        name: projectPrefix,
    };
    var ogProjectSettings = {
        name: ogProjectPrefix,
    };
    var dummyOGProjectSettings = {
        // eslint-disable-next-line spellcheck/spell-checker
        name: 'dummyog1',
    };
    // OG is the CLI project that creates the user pool to import by other test projects
    var ogProjectRoot;
    var ogShortId;
    var ogSettings;
    var ogProjectDetails;
    // We need an extra OG project to make sure that autocomplete prompt hits in
    var dummyOGProjectRoot;
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
                    ogSettings = (0, import_helpers_1.createUserPoolOnlyWithOAuthSettings)(ogProjectSettings.name, ogShortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(ogProjectRoot, ogProjectSettings)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthUserPoolOnlyWithOAuth)(ogProjectRoot, ogSettings)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(ogProjectRoot)];
                case 4:
                    _a.sent();
                    ogProjectDetails = (0, import_helpers_1.getOGAuthProjectDetails)(ogProjectRoot);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(dummyOGProjectSettings.name)];
                case 5:
                    dummyOGProjectRoot = _a.sent();
                    dummyOGSettings = (0, import_helpers_1.createUserPoolOnlyWithOAuthSettings)(dummyOGProjectSettings.name, ogShortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(dummyOGProjectRoot, dummyOGProjectSettings)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthUserPoolOnlyWithOAuth)(dummyOGProjectRoot, dummyOGSettings)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(dummyOGProjectRoot)];
                case 8:
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
    it('status should reflect correct values for imported auth', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectDetails;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' })];
                case 2:
                    _a.sent();
                    projectDetails = (0, import_helpers_1.getAuthProjectDetails)(projectRoot);
                    (0, import_helpers_1.expectAuthProjectDetailsMatch)(projectDetails, ogProjectDetails);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Import')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'No Change')];
                case 5:
                    _a.sent();
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projectRoot);
                    projectDetails = (0, import_helpers_1.getAuthProjectDetails)(projectRoot);
                    (0, import_helpers_1.expectAuthProjectDetailsMatch)(projectDetails, ogProjectDetails);
                    return [4 /*yield*/, (0, import_helpers_1.removeImportedAuthWithDefault)(projectRoot)];
                case 6:
                    _a.sent();
                    // eslint-disable-next-line spellcheck/spell-checker
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Unlink')];
                case 7:
                    // eslint-disable-next-line spellcheck/spell-checker
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 8:
                    _a.sent();
                    (0, import_helpers_1.expectNoAuthInMeta)(projectRoot);
                    (0, import_helpers_1.expectLocalTeamInfoHasNoCategories)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('imported auth with graphql api and cognito should push', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' })];
                case 2:
                    _a.sent(); // space at to make sure its not web client
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithCognitoUserPoolAuthTypeWhenAuthExists)(projectRoot, { transformerVersion: 1 })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectRoot)];
                case 4:
                    _a.sent();
                    (0, import_helpers_1.expectApiHasCorrectAuthConfig)(projectRoot, projectPrefix, ogProjectDetails.meta.UserPoolId);
                    return [2 /*return*/];
            }
        });
    }); });
    it('imported auth with function and crud on auth should push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, authResourceName, projectDetails, amplifyBackendDirPath, functionFilePath, amplifyFunctionIndexFilePath, cognitoResourceNameUpperCase, userPoolIDEnvVarName, indexJSContents, rootStack, functionResourceName, authParameterName, functionResource, functionStackFilePath, functionStack;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _k.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' })];
                case 2:
                    _k.sent();
                    functionName = (0, functionTester_1.randomizedFunctionName)('authimpfunc');
                    authResourceName = (0, authHelper_1.getCognitoResourceName)(projectRoot);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projectRoot, {
                            name: functionName,
                            functionTemplate: 'Hello World',
                            additionalPermissions: {
                                permissions: ['auth'],
                                choices: ['auth'],
                                resources: [authResourceName],
                                resourceChoices: [authResourceName],
                                operations: ['create', 'read', 'update', 'delete'],
                            },
                        }, 'nodejs')];
                case 3:
                    _k.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 4:
                    _k.sent();
                    projectDetails = (0, import_helpers_1.getAuthProjectDetails)(projectRoot);
                    amplifyBackendDirPath = path.join(projectRoot, 'amplify', 'backend');
                    functionFilePath = path.join(amplifyBackendDirPath, 'function', functionName);
                    amplifyFunctionIndexFilePath = path.join(functionFilePath, 'src', 'index.js');
                    cognitoResourceNameUpperCase = projectDetails.authResourceName.toUpperCase();
                    userPoolIDEnvVarName = "AUTH_".concat(cognitoResourceNameUpperCase, "_USERPOOLID");
                    indexJSContents = fs.readFileSync(amplifyFunctionIndexFilePath).toString();
                    expect(indexJSContents.indexOf(userPoolIDEnvVarName)).toBeGreaterThanOrEqual(0);
                    rootStack = (0, import_helpers_1.readRootStack)(projectRoot);
                    functionResourceName = "function".concat(functionName);
                    authParameterName = "auth".concat(projectDetails.authResourceName, "UserPoolId");
                    functionResource = rootStack.Resources[functionResourceName];
                    expect((_a = functionResource.Properties) === null || _a === void 0 ? void 0 : _a.Parameters[authParameterName]).toEqual(projectDetails.meta.UserPoolId);
                    functionStackFilePath = path.join(functionFilePath, "".concat(functionName, "-cloudformation-template.json"));
                    functionStack = amplify_cli_core_1.JSONUtilities.readJson(functionStackFilePath);
                    expect((_e = (_d = (_c = (_b = functionStack.Resources) === null || _b === void 0 ? void 0 : _b.LambdaFunction) === null || _c === void 0 ? void 0 : _c.Properties) === null || _d === void 0 ? void 0 : _d.Environment) === null || _e === void 0 ? void 0 : _e.Variables[userPoolIDEnvVarName].Ref).toEqual(authParameterName);
                    // Verify if generated policy has the userpool id as resource
                    expect((_j = (_h = (_g = (_f = functionStack.Resources) === null || _f === void 0 ? void 0 : _f.AmplifyResourcesPolicy) === null || _g === void 0 ? void 0 : _g.Properties) === null || _h === void 0 ? void 0 : _h.PolicyDocument) === null || _j === void 0 ? void 0 : _j.Statement[0].Resource[0]['Fn::Join'][1][5]).toEqual(projectDetails.meta.UserPoolId);
                    return [2 /*return*/];
            }
        });
    }); });
    it('imported userpool only auth, s3 storage add should fail with error', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' })];
                case 2:
                    _a.sent();
                    // Imported auth resources cannot be used together with \'storage\' category\'s authenticated and unauthenticated access.
                    return [4 /*yield*/, expect((0, import_helpers_1.addS3WithAuthConfigurationMismatchErrorExit)(projectRoot, {})).rejects.toThrowError('Process exited with non zero exit code 1')];
                case 3:
                    // Imported auth resources cannot be used together with \'storage\' category\'s authenticated and unauthenticated access.
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('imported user pool only should allow iam auth in graphql api', function () { return __awaiter(void 0, void 0, void 0, function () {
        var rootStackTemplate, apiStackParams;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _d.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' })];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projectRoot, {
                            'Amazon Cognito User Pool': {},
                            IAM: {},
                            transformerVersion: 2,
                        }, false)];
                case 3:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projectRoot, projectPrefix, 'model_with_owner_and_iam_auth.graphql')];
                case 4:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectRoot)];
                case 5:
                    _d.sent();
                    rootStackTemplate = (0, amplify_e2e_core_1.getRootStackTemplate)(projectRoot);
                    apiStackParams = (_c = (_b = (_a = rootStackTemplate === null || rootStackTemplate === void 0 ? void 0 : rootStackTemplate.Resources) === null || _a === void 0 ? void 0 : _a["api".concat(projectPrefix)]) === null || _b === void 0 ? void 0 : _b.Properties) === null || _c === void 0 ? void 0 : _c.Parameters;
                    expect(apiStackParams).toBeDefined();
                    expect(apiStackParams.authRoleName).toEqual({
                        Ref: 'AuthRoleName',
                    });
                    expect(apiStackParams.unauthRoleName).toEqual({
                        Ref: 'UnauthRoleName',
                    });
                    return [2 /*return*/];
            }
        });
    }); });
    it('should update parameters.json with auth configuration', function () { return __awaiter(void 0, void 0, void 0, function () {
        var ogProjectAuthParameters, projectDetails, projectAuthParameters;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' })];
                case 2:
                    _a.sent();
                    ogProjectAuthParameters = amplify_cli_core_1.stateManager.getResourceParametersJson(ogProjectRoot, 'auth', ogProjectDetails.authResourceName);
                    projectDetails = (0, import_helpers_1.getAuthProjectDetails)(projectRoot);
                    projectAuthParameters = amplify_cli_core_1.stateManager.getResourceParametersJson(projectRoot, 'auth', projectDetails.authResourceName);
                    (0, import_helpers_1.expectAuthParametersMatch)(projectAuthParameters, ogProjectAuthParameters);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'Import')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyStatus)(projectRoot, 'No Change')];
                case 5:
                    _a.sent();
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projectRoot);
                    projectDetails = (0, import_helpers_1.getAuthProjectDetails)(projectRoot);
                    projectAuthParameters = amplify_cli_core_1.stateManager.getResourceParametersJson(projectRoot, 'auth', projectDetails.authResourceName);
                    (0, import_helpers_1.expectAuthParametersMatch)(projectAuthParameters, ogProjectAuthParameters);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=import_auth_1.test.js.map