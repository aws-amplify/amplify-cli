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
var path = __importStar(require("path"));
var fs = __importStar(require("fs-extra"));
var PROJECT_NAME = 'authTest';
var defaultSettings = {
    name: PROJECT_NAME,
};
describe('zero config auth', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('zero-config-auth')];
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
    it('...should init a javascript project and add auth with all options and update front end config', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, authMeta;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, defaultSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithMaxOptions)(projRoot, {})];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    authMeta = Object.values(meta.auth)[1];
                    expect(authMeta.frontendAuthConfig).toMatchInlineSnapshot("\n      Object {\n        \"mfaConfiguration\": \"ON\",\n        \"mfaTypes\": Array [\n          \"SMS\",\n          \"TOTP\",\n        ],\n        \"passwordProtectionSettings\": Object {\n          \"passwordPolicyCharacters\": Array [\n            \"REQUIRES_LOWERCASE\",\n            \"REQUIRES_UPPERCASE\",\n            \"REQUIRES_NUMBERS\",\n            \"REQUIRES_SYMBOLS\",\n          ],\n          \"passwordPolicyMinLength\": 8,\n        },\n        \"signupAttributes\": Array [\n          \"EMAIL\",\n        ],\n        \"socialProviders\": Array [\n          \"FACEBOOK\",\n          \"GOOGLE\",\n          \"AMAZON\",\n          \"APPLE\",\n        ],\n        \"usernameAttributes\": Array [],\n        \"verificationMechanisms\": Array [\n          \"EMAIL\",\n        ],\n      }\n    ");
                    return [2 /*return*/];
            }
        });
    }); });
    it('...should init a project and add auth with defaults with overrides', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, authResourceName, id, userPool, destOverrideFilePath, srcInvalidOverrideCompileError, srcInvalidOverrideRuntimeError, srcOverrideFilePath, overwrittenUserPool;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, defaultSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.runAmplifyAuthConsole)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    authResourceName = Object.keys(meta.auth).filter(function (key) { return meta.auth[key].service === 'Cognito'; });
                    id = Object.keys(meta.auth).map(function (key) { return meta.auth[key]; })[0].output.UserPoolId;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getUserPool)(id, meta.providers.awscloudformation.Region)];
                case 5:
                    userPool = _a.sent();
                    expect(userPool.UserPool).toBeDefined();
                    // override new env
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyOverrideAuth)(projRoot)];
                case 6:
                    // override new env
                    _a.sent();
                    destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'auth', "".concat(authResourceName), 'override.ts');
                    srcInvalidOverrideCompileError = path.join(__dirname, '..', '..', 'overrides', 'override-compile-error.txt');
                    fs.copyFileSync(srcInvalidOverrideCompileError, destOverrideFilePath);
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.amplifyPushOverride)(projRoot)).rejects.toThrowError()];
                case 7:
                    _a.sent();
                    srcInvalidOverrideRuntimeError = path.join(__dirname, '..', '..', 'overrides', 'override-runtime-error.txt');
                    fs.copyFileSync(srcInvalidOverrideRuntimeError, destOverrideFilePath);
                    return [4 /*yield*/, expect((0, amplify_e2e_core_1.amplifyPushOverride)(projRoot)).rejects.toThrowError()];
                case 8:
                    _a.sent();
                    srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-auth.ts');
                    (0, amplify_e2e_core_1.replaceOverrideFileWithProjectInfo)(srcOverrideFilePath, destOverrideFilePath, 'integtest', PROJECT_NAME);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushOverride)(projRoot)];
                case 9:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getUserPool)(id, meta.providers.awscloudformation.Region)];
                case 10:
                    overwrittenUserPool = _a.sent();
                    expect(overwrittenUserPool.UserPool).toBeDefined();
                    expect(overwrittenUserPool.UserPool.DeviceConfiguration.ChallengeRequiredOnNewDevice).toBe(true);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=auth_6.test.js.map