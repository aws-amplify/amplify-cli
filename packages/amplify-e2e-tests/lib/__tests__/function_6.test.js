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
var uuid_1 = require("uuid");
var env_1 = require("../environment/env");
describe('function environment variables', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('functions')];
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
    it('configures env vars that are accessible in the cloud', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, meta, region, funcDef;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot)];
                case 1:
                    _d.sent();
                    functionName = "testfunction".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: functionName,
                            environmentVariables: {
                                key: 'FOO_BAR',
                                value: 'fooBar',
                            },
                        }, 'nodejs')];
                case 2:
                    _d.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _d.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    region = Object.values(meta.function)[0].output.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getLambdaFunction)("".concat(functionName, "-integtest"), region)];
                case 4:
                    funcDef = _d.sent();
                    expect((_c = (_b = (_a = funcDef === null || funcDef === void 0 ? void 0 : funcDef.Configuration) === null || _a === void 0 ? void 0 : _a.Environment) === null || _b === void 0 ? void 0 : _b.Variables) === null || _c === void 0 ? void 0 : _c.FOO_BAR).toEqual('fooBar');
                    return [2 /*return*/];
            }
        });
    }); });
    it('resolves missing env vars on push', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, tpi, meta, region, funcDef;
        var _a, _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: 
                // add func w/ env var
                return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot)];
                case 1:
                    // add func w/ env var
                    _d.sent();
                    functionName = "testfunction".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: functionName,
                            environmentVariables: {
                                key: 'FOO_BAR',
                                value: 'fooBar',
                            },
                        }, 'nodejs')];
                case 2:
                    _d.sent();
                    tpi = (0, amplify_e2e_core_1.getTeamProviderInfo)(projRoot);
                    expect(Object.values(tpi.integtest.categories.function)[0].fooBar).toEqual('fooBar');
                    Object.values(tpi.integtest.categories.function)[0].fooBar = undefined;
                    (0, amplify_e2e_core_1.setTeamProviderInfo)(projRoot, tpi);
                    // push -> should prompt for a new value
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushMissingEnvVar)(projRoot, 'newvalue')];
                case 3:
                    // push -> should prompt for a new value
                    _d.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    region = Object.values(meta.function)[0].output.Region;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getLambdaFunction)("".concat(functionName, "-integtest"), region)];
                case 4:
                    funcDef = _d.sent();
                    expect((_c = (_b = (_a = funcDef === null || funcDef === void 0 ? void 0 : funcDef.Configuration) === null || _a === void 0 ? void 0 : _a.Environment) === null || _b === void 0 ? void 0 : _b.Variables) === null || _c === void 0 ? void 0 : _c.FOO_BAR).toEqual('newvalue');
                    return [2 /*return*/];
            }
        });
    }); });
    it('carries over env vars to new env', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, tpi;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // add func w/ env var
                return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot)];
                case 1:
                    // add func w/ env var
                    _a.sent();
                    functionName = "testfunction".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: functionName,
                            environmentVariables: {
                                key: 'FOO_BAR',
                                value: 'fooBar',
                            },
                        }, 'nodejs')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, env_1.addEnvironmentYes)(projRoot, { envName: 'testtest' })];
                case 3:
                    _a.sent();
                    tpi = (0, amplify_e2e_core_1.getTeamProviderInfo)(projRoot);
                    expect(Object.values(tpi.testtest.categories.function)[0].fooBar).toEqual('fooBar');
                    return [2 /*return*/];
            }
        });
    }); });
    it('function force push with no change', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectName, shortId, functionName, meta, beforeDirHash, afterDirHash;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectName = 'functionNoChange';
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    functionName = "testfunction".concat(shortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projectName })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            name: functionName,
                        }, 'nodejs')];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionBuild)(projRoot)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 4:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                    beforeDirHash = meta.function[functionName].lastPushDirHash;
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushForce)(projRoot)];
                case 5:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                    afterDirHash = meta.function[functionName].lastPushDirHash;
                    expect(beforeDirHash).toBe(afterDirHash);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=function_6.test.js.map