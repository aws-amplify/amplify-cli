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
var specialCaseInit = __importStar(require("../init-special-cases"));
describe('amplify init', function () {
    var projectRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('special-init')];
                case 1:
                    projectRoot = _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    afterEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.deleteProject)(projectRoot)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.deleteProjectDir)(projectRoot);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init without credential files and no new user set up', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, AuthRoleName, UnauthRoleName, UnauthRoleArn, AuthRoleArn, DeploymentBucketName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, specialCaseInit.initWithoutCredentialFileAndNoNewUserSetup(projectRoot)];
                case 1:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot).providers.awscloudformation;
                    expect(meta.Region).toBeDefined();
                    AuthRoleName = meta.AuthRoleName, UnauthRoleName = meta.UnauthRoleName, UnauthRoleArn = meta.UnauthRoleArn, AuthRoleArn = meta.AuthRoleArn, DeploymentBucketName = meta.DeploymentBucketName;
                    expect(UnauthRoleName).toBeIAMRoleWithArn(UnauthRoleArn);
                    expect(AuthRoleName).toBeIAMRoleWithArn(AuthRoleArn);
                    expect(DeploymentBucketName).toBeAS3Bucket(DeploymentBucketName);
                    return [2 /*return*/];
            }
        });
    }); });
    it('test init on a git pulled project', function () { return __awaiter(void 0, void 0, void 0, function () {
        var envName, resourceName, teamInfo, appId, stackName, meta, authResourceName, category;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    envName = 'dev';
                    resourceName = 'authConsoleTest';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projectRoot, { disableAmplifyAppCreation: false, name: resourceName, envName: envName })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthAddUserGroups)(projectRoot, ['group'])];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projectRoot)];
                case 4:
                    _a.sent();
                    teamInfo = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
                    expect(teamInfo).toBeDefined();
                    appId = teamInfo[envName].awscloudformation.AmplifyAppId;
                    stackName = teamInfo[envName].awscloudformation.StackName;
                    expect(stackName).toBeDefined();
                    expect(appId).toBeDefined();
                    expect(teamInfo[envName].categories.auth).toBeDefined();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projectRoot);
                    authResourceName = Object.keys(meta.auth)[0];
                    category = 'auth';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.gitInit)(projectRoot)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.gitCommitAll)(projectRoot)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.gitCleanFdx)(projectRoot)];
                case 7:
                    _a.sent();
                    expect(function () {
                        (0, amplify_e2e_core_1.getParameters)(projectRoot, category, authResourceName);
                    }).toThrow();
                    // add new environment test to not crash
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updatedInitNewEnvWithProfile)(projectRoot, { envName: 'test' })];
                case 8:
                    // add new environment test to not crash
                    _a.sent();
                    // check parameters.json exists
                    expect(function () {
                        (0, amplify_e2e_core_1.getParameters)(projectRoot, category, authResourceName);
                    }).not.toThrow();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=init-special-case.test.js.map