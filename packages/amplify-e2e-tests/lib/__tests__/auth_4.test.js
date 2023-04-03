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
var fs = __importStar(require("fs-extra"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var defaultsSettings = {
    name: 'authTest',
};
describe('amplify updating auth...', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('auth-update')];
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
    it('...should edit signin url on update', function () { return __awaiter(void 0, void 0, void 0, function () {
        var settings;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    settings = {
                        signinUrl: 'http://localhost:3001/',
                        signoutUrl: 'http://localhost:3002/',
                        updatesigninUrl: 'http://localhost:3003/',
                        updatesignoutUrl: 'http://localhost:3004/',
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initAndroidProjectWithProfile)(projRoot, defaultsSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithSignInSignOutUrl)(projRoot, settings)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthSignInSignOutUrl)(projRoot, settings)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('...should init a project and add auth with a custom trigger, and then update to remove the custom js while leaving the other js', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, functionName, authMeta, id, userPool, clientIds, clients, lambdaFunction, dirContents, updatedFunction, updatedDirContents;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, defaultsSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithCustomTrigger)(projRoot, {})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    functionName = "".concat(Object.keys(meta.auth)[0], "PreSignup-integtest");
                    authMeta = Object.keys(meta.auth).map(function (key) { return meta.auth[key]; })[0];
                    id = authMeta.output.UserPoolId;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getUserPool)(id, meta.providers.awscloudformation.Region)];
                case 4:
                    userPool = _a.sent();
                    clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getUserPoolClients)(id, clientIds, meta.providers.awscloudformation.Region)];
                case 5:
                    clients = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getLambdaFunction)(functionName, meta.providers.awscloudformation.Region)];
                case 6:
                    lambdaFunction = _a.sent();
                    dirContents = fs.readdirSync("".concat(projRoot, "/amplify/backend/function/").concat(Object.keys(meta.auth)[0], "PreSignup/src"));
                    expect(dirContents.includes('custom.js')).toBeTruthy();
                    expect(userPool.UserPool).toBeDefined();
                    expect(clients).toHaveLength(2);
                    expect(lambdaFunction).toBeDefined();
                    expect(lambdaFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-denylist,custom');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthWithoutCustomTrigger)(projRoot, {})];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getLambdaFunction)(functionName, meta.providers.awscloudformation.Region)];
                case 9:
                    updatedFunction = _a.sent();
                    updatedDirContents = fs.readdirSync("".concat(projRoot, "/amplify/backend/function/").concat(Object.keys(meta.auth)[0], "PreSignup/src"));
                    expect(updatedDirContents.includes('custom.js')).toBeFalsy();
                    expect(updatedDirContents.includes('email-filter-denylist.js')).toBeTruthy();
                    expect(updatedFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-denylist');
                    expect(lambdaFunction.Configuration.Environment.Variables.DOMAINDENYLIST).toEqual('amazon.com');
                    return [2 /*return*/];
            }
        });
    }); });
    it('...should init a project and add auth with a custom trigger using legacy language', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, authName, functionName, lambdaFunction, dirContents;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, defaultsSettings)];
                case 1:
                    _a.sent();
                    (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'auth', 'useinclusiveterminology', false);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithCustomTrigger)(projRoot, { useInclusiveTerminology: false })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    authName = Object.keys(meta.auth)[0];
                    functionName = "".concat(authName, "PreSignup-integtest");
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getFunction)(functionName, meta.providers.awscloudformation.Region)];
                case 4:
                    lambdaFunction = _a.sent();
                    dirContents = fs.readdirSync("".concat(projRoot, "/amplify/backend/function/").concat(authName, "PreSignup/src"));
                    expect(lambdaFunction).toBeDefined();
                    expect(lambdaFunction.Configuration.Environment.Variables.MODULES).toEqual('email-filter-denylist-legacy,custom');
                    expect(lambdaFunction.Configuration.Environment.Variables.DOMAINBLACKLIST).toEqual('amazon.com');
                    expect(dirContents.includes('email-filter-denylist-legacy.js')).toBeTruthy();
                    return [2 /*return*/];
            }
        });
    }); });
    it('...should init an android project and add customAuth flag, and remove flag when custom auth triggers are removed upon update', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initAndroidProjectWithProfile)(projRoot, defaultsSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithRecaptchaTrigger)(projRoot, {})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getAwsAndroidConfig)(projRoot);
                    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
                    expect(meta.Auth.Default.authenticationFlowType).toEqual('CUSTOM_AUTH');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthRemoveRecaptchaTrigger)(projRoot, {})];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 5:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getAwsAndroidConfig)(projRoot);
                    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
                    expect(meta.Auth.Default.authenticationFlowType).toEqual('USER_SRP_AUTH');
                    return [2 /*return*/];
            }
        });
    }); });
    it('...should init an ios project and add customAuth flag, and remove the flag when custom auth triggers are removed upon update', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initIosProjectWithProfile)(projRoot, defaultsSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithRecaptchaTrigger)(projRoot, {})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getAwsIOSConfig)(projRoot);
                    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
                    expect(meta.Auth.Default.authenticationFlowType).toEqual('CUSTOM_AUTH');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthRemoveRecaptchaTrigger)(projRoot, {})];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 5:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getAwsIOSConfig)(projRoot);
                    expect(meta.Auth.Default.authenticationFlowType).toBeDefined();
                    expect(meta.Auth.Default.authenticationFlowType).toEqual('USER_SRP_AUTH');
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=auth_4.test.js.map