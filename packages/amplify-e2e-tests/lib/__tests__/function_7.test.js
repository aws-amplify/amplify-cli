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
var env_1 = require("../environment/env");
describe('function secret value', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('funcsecrets')];
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
    it('configures secret that is accessible in the cloud', function () { return __awaiter(void 0, void 0, void 0, function () {
        var funcName, lambdaEvent, meta, region, response;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: 
                // add func with secret
                return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { disableAmplifyAppCreation: false })];
                case 1:
                    // add func with secret
                    _b.sent();
                    funcName = "secretsTest".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: funcName,
                            secretsConfig: {
                                operation: 'add',
                                name: 'TEST_SECRET',
                                value: 'testsecretvalue',
                            },
                        }, 'nodejs')];
                case 2:
                    _b.sent();
                    // override lambda code to fetch the secret and return the value
                    (0, amplify_e2e_core_1.overrideFunctionCodeNode)(projRoot, funcName, 'retrieve-secret.js');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _b.sent();
                    lambdaEvent = {
                        secretNames: ['TEST_SECRET'],
                    };
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    region = Object.values(meta.function)[0].output.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.invokeFunction)("".concat(funcName, "-integtest"), JSON.stringify(lambdaEvent), region)];
                case 4:
                    response = _b.sent();
                    expect((_a = JSON.parse(response.Payload.toString())[0]) === null || _a === void 0 ? void 0 : _a.Value).toEqual('testsecretvalue');
                    return [2 /*return*/];
            }
        });
    }); });
    it('removes secrets immediately when func not pushed', function () { return __awaiter(void 0, void 0, void 0, function () {
        var funcName, meta, _a, appId, region;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // add func w/ secret
                return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { disableAmplifyAppCreation: false })];
                case 1:
                    // add func w/ secret
                    _c.sent();
                    funcName = "secretsTest".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: funcName,
                            secretsConfig: {
                                operation: 'add',
                                name: 'TEST_SECRET',
                                value: 'testsecretvalue',
                            },
                        }, 'nodejs')];
                case 2:
                    _c.sent();
                    // remove secret
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot, {
                            secretsConfig: {
                                operation: 'delete',
                                name: 'TEST_SECRET',
                            },
                        }, 'nodejs')];
                case 3:
                    // remove secret
                    _c.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = (_b = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _b === void 0 ? void 0 : _b.awscloudformation, appId = _a.AmplifyAppId, region = _a.Region;
                    expect(appId).toBeDefined();
                    return [4 /*yield*/, expectParams([], ['TEST_SECRET'], region, appId, 'integtest', funcName)];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('removes secrets immediately when unpushed function is removed from project', function () { return __awaiter(void 0, void 0, void 0, function () {
        var funcName, meta, _a, appId, region;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // add func w/ secret
                return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { disableAmplifyAppCreation: false })];
                case 1:
                    // add func w/ secret
                    _c.sent();
                    funcName = "secretsTest".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: funcName,
                            secretsConfig: {
                                operation: 'add',
                                name: 'TEST_SECRET',
                                value: 'testsecretvalue',
                            },
                        }, 'nodejs')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeFunction)(projRoot, funcName)];
                case 3:
                    _c.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = (_b = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _b === void 0 ? void 0 : _b.awscloudformation, appId = _a.AmplifyAppId, region = _a.Region;
                    expect(appId).toBeDefined();
                    return [4 /*yield*/, expectParams([], ['TEST_SECRET'], region, appId, 'integtest', funcName)];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('removes secrets on push when func is already pushed', function () { return __awaiter(void 0, void 0, void 0, function () {
        var funcName, meta, _a, appId, region;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // add func w/ secret
                return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { disableAmplifyAppCreation: false })];
                case 1:
                    // add func w/ secret
                    _c.sent();
                    funcName = "secretsTest".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: funcName,
                            secretsConfig: {
                                operation: 'add',
                                name: 'TEST_SECRET',
                                value: 'testsecretvalue',
                            },
                        }, 'nodejs')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _c.sent();
                    // remove secret
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot, {
                            secretsConfig: {
                                operation: 'delete',
                                name: 'TEST_SECRET',
                            },
                        }, 'nodejs')];
                case 4:
                    // remove secret
                    _c.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = (_b = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _b === void 0 ? void 0 : _b.awscloudformation, appId = _a.AmplifyAppId, region = _a.Region;
                    expect(appId).toBeDefined();
                    return [4 /*yield*/, expectParams([{ name: 'TEST_SECRET', value: 'testsecretvalue' }], [], region, appId, 'integtest', funcName)];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 6:
                    _c.sent();
                    // check that ssm param doesn't exist
                    return [4 /*yield*/, expectParams([], ['TEST_SECRET'], region, appId, 'integtest', funcName)];
                case 7:
                    // check that ssm param doesn't exist
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('removes secrets on push when pushed function is removed', function () { return __awaiter(void 0, void 0, void 0, function () {
        var funcName, meta, _a, appId, region;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // add func w/ secret
                return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { disableAmplifyAppCreation: false })];
                case 1:
                    // add func w/ secret
                    _c.sent();
                    funcName = "secretsTest".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: funcName,
                            secretsConfig: {
                                operation: 'add',
                                name: 'TEST_SECRET',
                                value: 'testsecretvalue',
                            },
                        }, 'nodejs')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _c.sent();
                    // remove function
                    return [4 /*yield*/, (0, amplify_e2e_core_1.removeFunction)(projRoot, funcName)];
                case 4:
                    // remove function
                    _c.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = (_b = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _b === void 0 ? void 0 : _b.awscloudformation, appId = _a.AmplifyAppId, region = _a.Region;
                    expect(appId).toBeDefined();
                    return [4 /*yield*/, expectParams([{ name: 'TEST_SECRET', value: 'testsecretvalue' }], [], region, appId, 'integtest', funcName)];
                case 5:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 6:
                    _c.sent();
                    // check that ssm param doesn't exist
                    return [4 /*yield*/, expectParams([], ['TEST_SECRET'], region, appId, 'integtest', funcName)];
                case 7:
                    // check that ssm param doesn't exist
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('removes / copies secrets when env removed / added, respectively', function () { return __awaiter(void 0, void 0, void 0, function () {
        var funcName, newEnvName, meta, _a, appId, region;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // add func w/ secret
                return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { disableAmplifyAppCreation: false })];
                case 1:
                    // add func w/ secret
                    _c.sent();
                    funcName = "secretsTest".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: funcName,
                            secretsConfig: {
                                operation: 'add',
                                name: 'TEST_SECRET',
                                value: 'testsecretvalue',
                            },
                        }, 'nodejs')];
                case 2:
                    _c.sent();
                    newEnvName = 'testtest';
                    return [4 /*yield*/, (0, env_1.addEnvironmentYes)(projRoot, { envName: newEnvName })];
                case 3:
                    _c.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = (_b = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _b === void 0 ? void 0 : _b.awscloudformation, appId = _a.AmplifyAppId, region = _a.Region;
                    expect(appId).toBeDefined();
                    return [4 /*yield*/, expectParams([{ name: 'TEST_SECRET', value: 'testsecretvalue' }], [], region, appId, newEnvName, funcName)];
                case 4:
                    _c.sent();
                    return [4 /*yield*/, (0, env_1.removeEnvironment)(projRoot, { envName: 'integtest' })];
                case 5:
                    _c.sent();
                    // check that ssm param doesn't exist in removed env
                    return [4 /*yield*/, expectParams([], ['TEST_SECRET'], region, appId, 'integtest', funcName)];
                case 6:
                    // check that ssm param doesn't exist in removed env
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('prompts for missing secrets and removes unused secrets on push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var funcName, funcParams, meta, _a, appId, region;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: 
                // add func w/ secret
                return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { disableAmplifyAppCreation: false })];
                case 1:
                    // add func w/ secret
                    _c.sent();
                    funcName = "secretsTest".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: funcName,
                            secretsConfig: {
                                operation: 'add',
                                name: 'TEST_SECRET',
                                value: 'testsecretvalue',
                            },
                        }, 'nodejs')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _c.sent();
                    funcParams = (0, amplify_e2e_core_1.getCategoryParameters)(projRoot, 'function', funcName);
                    funcParams.secretNames = ['A_NEW_SECRET'];
                    (0, amplify_e2e_core_1.setCategoryParameters)(projRoot, 'function', funcName, funcParams);
                    // trigger a func update
                    (0, amplify_e2e_core_1.overrideFunctionCodeNode)(projRoot, funcName, 'retrieve-secret.js');
                    // push -> should prompt for value for new secret
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushMissingFuncSecret)(projRoot, 'anewtestsecretvalue')];
                case 4:
                    // push -> should prompt for value for new secret
                    _c.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = (_b = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _b === void 0 ? void 0 : _b.awscloudformation, appId = _a.AmplifyAppId, region = _a.Region;
                    expect(appId).toBeDefined();
                    // check that old value is removed and new one is added
                    return [4 /*yield*/, expectParams([{ name: 'A_NEW_SECRET', value: 'anewtestsecretvalue' }], ['TEST_SECRET'], region, appId, 'integtest', funcName)];
                case 5:
                    // check that old value is removed and new one is added
                    _c.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
var expectParams = function (expectToExist, expectNotExist, region, appId, envName, funcName) { return __awaiter(void 0, void 0, void 0, function () {
    var result, mapName, mappedResult, mappedExpect;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.getSSMParameters)(region, appId, envName, funcName, expectToExist.map(function (exist) { return exist.name; }).concat(expectNotExist))];
            case 1:
                result = _a.sent();
                mapName = function (name) { return "/amplify/".concat(appId, "/").concat(envName, "/AMPLIFY_").concat(funcName, "_").concat(name); };
                expect(result.InvalidParameters.length).toBe(expectNotExist.length);
                expect(result.InvalidParameters.sort()).toEqual(expectNotExist.map(mapName).sort());
                expect(result.Parameters.length).toBe(expectToExist.length);
                mappedResult = result.Parameters.map(function (param) { return ({ name: param.Name, value: param.Value }); }).sort(sortByName);
                mappedExpect = expectToExist
                    .map(function (exist) { return ({ name: "/amplify/".concat(appId, "/").concat(envName, "/AMPLIFY_").concat(funcName, "_").concat(exist.name), value: exist.value }); })
                    .sort(sortByName);
                expect(mappedResult).toEqual(mappedExpect);
                return [2 /*return*/];
        }
    });
}); };
var sortByName = function (a, b) { return a.name.localeCompare(b.name); };
//# sourceMappingURL=function_7.test.js.map