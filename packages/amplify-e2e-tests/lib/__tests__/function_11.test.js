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
describe('Lambda AppSync nodejs:', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('lambda-appsync-nodejs')];
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
    it('Test case for when API is not present', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projName = "iammodel".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projName })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'AppSync - GraphQL API request (with IAM)',
                            expectFailure: true,
                            additionalPermissions: {
                                permissions: ['api'],
                                choices: ['api'],
                                resources: ['Test_API'],
                                operations: ['Query'],
                            },
                        }, 'nodejs')];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('Test case for when IAM Auth is not present', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projName = "iammodel".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projName })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projRoot, {
                            'API key': {},
                        })];
                case 2:
                    _a.sent();
                    expect((0, amplify_e2e_core_1.getBackendConfig)(projRoot)).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'AppSync - GraphQL API request (with IAM)',
                            expectFailure: true,
                        }, 'nodejs')];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('Test case when IAM is set as default auth', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projName, beforeMeta, apiName, meta, _a, functionArn, functionName, region, cloudFunction, payloadObj, fnResponse, gqlResponse;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    projName = "iammodel".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projName })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projRoot, { IAM: {}, transformerVersion: 2 })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projName, 'iam_simple_model.graphql')];
                case 3:
                    _b.sent();
                    expect((0, amplify_e2e_core_1.getBackendConfig)(projRoot)).toBeDefined();
                    beforeMeta = (0, amplify_e2e_core_1.getBackendConfig)(projRoot);
                    apiName = Object.keys(beforeMeta.api)[0];
                    expect(apiName).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'AppSync - GraphQL API request (with IAM)',
                            additionalPermissions: {
                                permissions: ['api'],
                                choices: ['api'],
                                resources: [apiName],
                                operations: ['Query'],
                            },
                        }, 'nodejs')];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionBuild)(projRoot)];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 6:
                    _b.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output, functionArn = _a.Arn, functionName = _a.Name, region = _a.Region;
                    expect(functionArn).toBeDefined();
                    expect(functionName).toBeDefined();
                    expect(region).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getFunction)(functionName, region)];
                case 7:
                    cloudFunction = _b.sent();
                    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
                    payloadObj = { test: 'test' };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.invokeFunction)(functionName, JSON.stringify(payloadObj), region)];
                case 8:
                    fnResponse = _b.sent();
                    expect(fnResponse.StatusCode).toBe(200);
                    expect(fnResponse.Payload).toBeDefined();
                    gqlResponse = JSON.parse(fnResponse.Payload);
                    expect(gqlResponse.body).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
    it('Test case for when IAM auth is set as secondary auth type', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projName, beforeMeta, apiName, meta, _a, functionArn, functionName, region, cloudFunction, payloadObj, fnResponse, gqlResponse;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    projName = "iammodel".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projName })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projRoot, { transformerVersion: 2, 'API key': {}, IAM: {} })];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projName, 'iam_simple_model.graphql')];
                case 3:
                    _b.sent();
                    expect((0, amplify_e2e_core_1.getBackendConfig)(projRoot)).toBeDefined();
                    beforeMeta = (0, amplify_e2e_core_1.getBackendConfig)(projRoot);
                    apiName = Object.keys(beforeMeta.api)[0];
                    expect(apiName).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'AppSync - GraphQL API request (with IAM)',
                            additionalPermissions: {
                                permissions: ['api'],
                                choices: ['api'],
                                resources: [apiName],
                                operations: ['Query'],
                            },
                        }, 'nodejs')];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionBuild)(projRoot)];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 6:
                    _b.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output, functionArn = _a.Arn, functionName = _a.Name, region = _a.Region;
                    expect(functionArn).toBeDefined();
                    expect(functionName).toBeDefined();
                    expect(region).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getFunction)(functionName, region)];
                case 7:
                    cloudFunction = _b.sent();
                    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
                    payloadObj = { test: 'test' };
                    return [4 /*yield*/, (0, amplify_e2e_core_1.invokeFunction)(functionName, JSON.stringify(payloadObj), region)];
                case 8:
                    fnResponse = _b.sent();
                    expect(fnResponse.StatusCode).toBe(200);
                    expect(fnResponse.Payload).toBeDefined();
                    gqlResponse = JSON.parse(fnResponse.Payload);
                    expect(gqlResponse.body).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=function_11.test.js.map