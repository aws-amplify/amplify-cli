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
var env_1 = require("../environment/env");
var import_helpers_1 = require("../import-helpers");
var authHelper_1 = require("../schema-api-directives/authHelper");
var functionTester_1 = require("../schema-api-directives/functionTester");
describe('auth import userpool only', function () {
    var profileName = 'amplify-integ-test-user';
    var projectPrefix = 'auimpup';
    var ogProjectPrefix = 'ogauimpup';
    var projectSettings = {
        name: projectPrefix,
    };
    var ogProjectSettings = {
        name: ogProjectPrefix,
    };
    var dummyOGProjectSettings = {
        name: 'dummyog1',
    };
    // OG is the CLI project that creates the user pool to import by other test projects
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
                    dummyOGShortId = (0, import_helpers_1.getShortId)();
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
    it('imported auth, push, pull to empty directory, files should match', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, authResourceName, appId, projectRootPull;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, __assign(__assign({}, projectSettings), { disableAmplifyAppCreation: false }))];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' })];
                case 2:
                    _a.sent();
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
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 4:
                    _a.sent();
                    appId = (0, amplify_e2e_core_1.getAppId)(projectRoot);
                    expect(appId).toBeDefined();
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, , 8, 9]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('authimport-pull')];
                case 6:
                    projectRootPull = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(projectRootPull, { override: false, emptyDir: true, appId: appId })];
                case 7:
                    _a.sent();
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projectRoot);
                    (0, import_helpers_1.expectLocalAndPulledBackendConfigMatching)(projectRoot, projectRootPull);
                    (0, import_helpers_1.expectAuthLocalAndOGMetaFilesOutputMatching)(projectRoot, projectRootPull);
                    return [3 /*break*/, 9];
                case 8:
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRootPull);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); });
    it('imported auth, create prod env, files should match', function () { return __awaiter(void 0, void 0, void 0, function () {
        var firstEnvName, secondEnvName, teamInfo, env1, env2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 3:
                    _a.sent();
                    firstEnvName = 'integtest';
                    secondEnvName = 'prod';
                    return [4 /*yield*/, (0, env_1.addEnvironmentWithImportedAuth)(projectRoot, {
                            envName: secondEnvName,
                            currentEnvName: firstEnvName,
                        })];
                case 4:
                    _a.sent();
                    teamInfo = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
                    env1 = teamInfo[firstEnvName];
                    env2 = teamInfo[secondEnvName];
                    // Verify that same auth resource object is present (second does not have hostedUIProviderCreds until push)
                    expect(Object.keys(env1)[0]).toEqual(Object.keys(env2)[0]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 5:
                    _a.sent();
                    // Meta is matching the data with the OG project's resources
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projectRoot);
                    (0, import_helpers_1.expectAuthLocalAndOGMetaFilesOutputMatching)(projectRoot, ogProjectRoot);
                    return [4 /*yield*/, (0, env_1.checkoutEnvironment)(projectRoot, {
                            envName: firstEnvName,
                        })];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, env_1.removeEnvironment)(projectRoot, {
                            envName: secondEnvName,
                        })];
                case 7:
                    _a.sent();
                    teamInfo = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
                    // No prod in team proovider info
                    expect(teamInfo.prod).toBeUndefined();
                    return [2 /*return*/];
            }
        });
    }); });
    // Disable as credentials are correctly not listing any UserPools with OG prefix
    it.skip('init project in different region, import auth, should fail with error', function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, newProjectRegion, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    // Set it to make sure deleteProject error will be ignored
                    ignoreProjectDeleteErrors = true;
                    _a = (0, amplify_e2e_core_1.getEnvVars)(), AWS_ACCESS_KEY_ID = _a.AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY = _a.AWS_SECRET_ACCESS_KEY;
                    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
                        throw new Error('Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY either in .env file or as Environment variable');
                    }
                    newProjectRegion = process.env.CLI_REGION === 'us-west-2' ? 'us-east-2' : 'us-west-2';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initProjectWithAccessKey)(projectRoot, __assign(__assign({}, projectSettings), { envName: 'integtest', accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY, region: newProjectRegion }))];
                case 1:
                    _c.sent();
                    _b = expect;
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: '_app_client ', web: '_app_clientWeb' })];
                case 2: 
                // The previously configured Cognito User Pool: '${userPoolName}' (${userPoolId}) cannot be found.
                return [4 /*yield*/, _b.apply(void 0, [_c.sent()]).rejects.toThrowError('Process exited with non zero exit code 1')];
                case 3:
                    // The previously configured Cognito User Pool: '${userPoolName}' (${userPoolId}) cannot be found.
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    // Used for creating custom app clients. This should match with web app client setting for import to work
    var customAppClientSettings = {
        supportedIdentityProviders: ['COGNITO', 'Facebook', 'Google', 'LoginWithAmazon', 'SignInWithApple'],
        allowedOAuthFlowsUserPoolClient: true,
        callbackURLs: ['https://sin1/', 'https://sin2/'],
        logoutURLs: ['https://sout1/', 'https://sout2/'],
        allowedOAuthFlows: ['code'],
        allowedScopes: ['aws.cognito.signin.user.admin', 'email', 'openid', 'phone', 'profile'],
    };
    it('should support importing AppClient with secret', function () { return __awaiter(void 0, void 0, void 0, function () {
        var nativeAppClientName, appClientId, appclientSecret, projectDetails;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    nativeAppClientName = 'nativeClientWithSecret';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 7, 8]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, import_helpers_1.addAppClientWithSecret)(profileName, ogProjectRoot, nativeAppClientName, customAppClientSettings)];
                case 3:
                    (_a = _b.sent(), appClientId = _a.appClientId, appclientSecret = _a.appclientSecret);
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: nativeAppClientName, web: '_app_clientWeb' })];
                case 4: return [4 /*yield*/, _b.sent()];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 6:
                    _b.sent();
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projectRoot);
                    projectDetails = (0, import_helpers_1.getAuthProjectDetails)(projectRoot);
                    (0, import_helpers_1.expectAuthProjectDetailsMatch)(projectDetails, __assign(__assign({}, ogProjectDetails), { meta: __assign(__assign({}, ogProjectDetails.meta), { AppClientID: appClientId, AppClientSecret: appclientSecret }), team: __assign(__assign({}, ogProjectDetails.team), { nativeClientId: appClientId }) }));
                    return [3 /*break*/, 8];
                case 7:
                    // delete the app client
                    if (appClientId) {
                        (0, import_helpers_1.deleteAppClient)(profileName, ogProjectRoot, appClientId);
                    }
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); });
    it('should support importing AppClient with out secret', function () { return __awaiter(void 0, void 0, void 0, function () {
        var nativeAppClientName, appClientId, appclientSecret, projectDetails;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    nativeAppClientName = 'nativeClientWithOutSecret';
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, , 7, 8]);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, projectSettings)];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, import_helpers_1.addAppClientWithoutSecret)(profileName, ogProjectRoot, nativeAppClientName, customAppClientSettings)];
                case 3:
                    (_a = _b.sent(), appClientId = _a.appClientId, appclientSecret = _a.appclientSecret);
                    return [4 /*yield*/, (0, import_helpers_1.importUserPoolOnly)(projectRoot, ogSettings.userPoolName, { native: nativeAppClientName, web: '_app_clientWeb' })];
                case 4: return [4 /*yield*/, _b.sent()];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 6:
                    _b.sent();
                    (0, import_helpers_1.expectLocalAndCloudMetaFilesMatching)(projectRoot);
                    projectDetails = (0, import_helpers_1.getAuthProjectDetails)(projectRoot);
                    (0, import_helpers_1.expectAuthProjectDetailsMatch)(projectDetails, __assign(__assign({}, ogProjectDetails), { meta: __assign(__assign({}, ogProjectDetails.meta), { AppClientID: appClientId, AppClientSecret: appclientSecret }), team: __assign(__assign({}, ogProjectDetails.team), { nativeClientId: appClientId }) }));
                    return [3 /*break*/, 8];
                case 7:
                    // delete the app client
                    if (appClientId) {
                        (0, import_helpers_1.deleteAppClient)(profileName, ogProjectRoot, appClientId);
                    }
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=import_auth_3.test.js.map