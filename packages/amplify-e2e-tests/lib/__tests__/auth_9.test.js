"use strict";
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
var defaultsSettings = {
    name: 'authTest',
};
describe('amplify auth with trigger', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('auth')];
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
    it('add auth with trigger, push, update auth, push, verify trigger attachment', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, userPoolId, userPool;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, defaultsSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithRecaptchaTrigger)(projRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    userPoolId = Object.keys(meta.auth).map(function (key) { return meta.auth[key]; })[0].output.UserPoolId;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getUserPool)(userPoolId, meta.providers.awscloudformation.Region)];
                case 4:
                    userPool = (_a.sent());
                    expect(userPool.UserPool).toBeDefined();
                    expect(userPool.UserPool.LambdaConfig).toBeDefined();
                    expect(userPool.UserPool.LambdaConfig.CreateAuthChallenge).toBeDefined();
                    expect(userPool.UserPool.LambdaConfig.DefineAuthChallenge).toBeDefined();
                    expect(userPool.UserPool.LambdaConfig.VerifyAuthChallengeResponse).toBeDefined();
                    return [4 /*yield*/, updateAuthChangeToUserPoolOnlyAndSetCodeMessages(projRoot, {})];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getUserPool)(userPoolId, meta.providers.awscloudformation.Region)];
                case 7:
                    userPool = (_a.sent());
                    expect(userPool.UserPool).toBeDefined();
                    expect(userPool.UserPool.EmailVerificationSubject).toBe('New code');
                    expect(userPool.UserPool.EmailVerificationMessage).toBe('New code is {####}');
                    expect(userPool.UserPool.LambdaConfig).toBeDefined();
                    expect(userPool.UserPool.LambdaConfig.CreateAuthChallenge).toBeDefined();
                    expect(userPool.UserPool.LambdaConfig.DefineAuthChallenge).toBeDefined();
                    expect(userPool.UserPool.LambdaConfig.VerifyAuthChallengeResponse).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    var updateAuthChangeToUserPoolOnlyAndSetCodeMessages = function (cwd, settings) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    var chain = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['update', 'auth'], { cwd: cwd, stripColors: true });
                    chain
                        .wait('What do you want to do')
                        .sendKeyDown()
                        .sendCarriageReturn()
                        .wait('Select the authentication/authorization services that you want to use')
                        .sendKeyDown()
                        .sendCarriageReturn()
                        .wait('Do you want to add User Pool Groups')
                        .sendKeyDown()
                        .sendCarriageReturn() // No
                        .wait('Do you want to add an admin queries API')
                        .sendKeyDown()
                        .sendCarriageReturn() // No
                        .wait('Multifactor authentication (MFA) user login options')
                        .sendCarriageReturn() // Select Off
                        .wait('Email based user registration/forgot password')
                        .sendCarriageReturn() // Enabled
                        .wait('Specify an email verification subject')
                        .sendLine('New code') // New code
                        .wait('Specify an email verification message')
                        .sendLine('New code is {####}') // New code is {####}
                        .wait('Do you want to override the default password policy')
                        .sendConfirmNo()
                        .wait("Specify the app's refresh token expiration period")
                        .sendCarriageReturn() // 30
                        .wait('Do you want to specify the user attributes this app can read and write')
                        .sendConfirmNo()
                        .wait('Do you want to enable any of the following capabilities')
                        .sendCarriageReturn() // Preserve recaptcha trigger
                        .wait('Do you want to use an OAuth flow')
                        .sendKeyDown()
                        .sendCarriageReturn() // No
                        .wait('Do you want to configure Lambda Triggers for Cognito')
                        .sendConfirmNo()
                        .sendEof()
                        .run(function (err) { return (err ? reject(err) : resolve()); });
                })];
        });
    }); };
});
//# sourceMappingURL=auth_9.test.js.map