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
/* eslint-disable spellcheck/spell-checker */
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var defaultsSettings = {
    name: 'authTest',
};
describe('amplify add auth...', function () {
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
    it('...should allow the user to add auth via API category, with a trigger and function dependsOn API', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, authKey, functionName, authMeta, id, region, userPool, clientIds, clients, lambdaEvent, result, user1Groups;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, defaultsSettings)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthwithUserPoolGroupsViaAPIWithTrigger)(projRoot, { transformerVersion: 1 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            additionalPermissions: {
                                permissions: ['storage'],
                                choices: ['function', 'auth', 'api', 'storage'],
                                resources: ['Todo:@model(appsync)'],
                                resourceChoices: ['Todo:@model(appsync)'],
                                operations: ['read'],
                            },
                        }, 'nodejs')];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    authKey = Object.keys(meta.auth).find(function (key) { return meta.auth[key].service === 'Cognito'; });
                    functionName = "".concat(authKey, "PostConfirmation-integtest");
                    authMeta = meta.auth[authKey];
                    id = authMeta.output.UserPoolId;
                    region = meta.providers.awscloudformation.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getUserPool)(id, region)];
                case 5:
                    userPool = _a.sent();
                    clientIds = [authMeta.output.AppClientIDWeb, authMeta.output.AppClientID];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getUserPoolClients)(id, clientIds, region)];
                case 6:
                    clients = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addUserToUserPool)(id, region)];
                case 7:
                    _a.sent();
                    lambdaEvent = {
                        userPoolId: id,
                        userName: 'testUser',
                    };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.invokeFunction)(functionName, JSON.stringify(lambdaEvent), region)];
                case 8:
                    result = _a.sent();
                    expect(result.StatusCode).toBe(200);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.listUserPoolGroupsForUser)(id, lambdaEvent.userName, region)];
                case 9:
                    user1Groups = _a.sent();
                    expect(user1Groups).toEqual(['mygroup']);
                    expect(userPool.UserPool).toBeDefined();
                    expect(Object.keys(userPool.UserPool.LambdaConfig)[0]).toBe('PostConfirmation');
                    expect(Object.values(userPool.UserPool.LambdaConfig)[0]).toBe(meta.function[functionName.split('-')[0]].output.Arn);
                    (0, amplify_e2e_core_1.validateNodeModulesDirRemoval)(projRoot);
                    expect(clients).toHaveLength(2);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=auth_2e.test.js.map