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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var lodash_1 = __importDefault(require("lodash"));
describe('test initEnv() behavior in function', function () {
    var projRoot;
    var projRoot2;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('functions')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('functions2')];
                case 2:
                    projRoot2 = _a.sent();
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
                    (0, amplify_e2e_core_1.deleteProjectDir)(projRoot2);
                    return [2 /*return*/];
            }
        });
    }); });
    it('init a project and add simple function and uncomment cors header', function () { return __awaiter(void 0, void 0, void 0, function () {
        var functionName, meta, appId, _a, functionArn, region, meta2, _b, functionArn2, region2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { disableAmplifyAppCreation: false })];
                case 1:
                    _c.sent();
                    functionName = "testfunction".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World', name: functionName }, 'nodejs')];
                case 2:
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 3:
                    _c.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    appId = (0, amplify_e2e_core_1.getAppId)(projRoot);
                    expect(appId).toBeDefined();
                    _a = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output, functionArn = _a.Arn, region = _a.Region;
                    expect(functionArn).toBeDefined();
                    expect(region).toBeDefined();
                    expect(lodash_1.default.get(meta, ['function', functionName, 's3Bucket'], undefined)).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPull)(projRoot2, { emptyDir: true, appId: appId })];
                case 4:
                    _c.sent();
                    // Change function resource status to Updated
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot2, {
                            schedulePermissions: {
                                interval: 'Weekly',
                                action: 'Update the schedule',
                                noScheduleAdded: true,
                            },
                        }, 'nodejs')];
                case 5:
                    // Change function resource status to Updated
                    _c.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot2)];
                case 6:
                    _c.sent();
                    meta2 = (0, amplify_e2e_core_1.getProjectMeta)(projRoot2);
                    _b = Object.keys(meta2.function).map(function (key) { return meta2.function[key]; })[0].output, functionArn2 = _b.Arn, region2 = _b.Region;
                    expect(functionArn2).toBeDefined();
                    expect(region2).toBeDefined();
                    expect(lodash_1.default.get(meta2, ['function', functionName, 's3Bucket'], undefined)).toBeDefined();
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('test dependency in root stack', function () {
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
    it('init a project with api and function and update the @model and add function access to @model', function () { return __awaiter(void 0, void 0, void 0, function () {
        var projectName, fnName;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectName = 'mytestapi';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {
                            name: projectName,
                        })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, 'simple_model.graphql')];
                case 3:
                    _a.sent();
                    fnName = "integtestfn".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            name: fnName,
                            functionTemplate: 'Hello World',
                        }, 'nodejs')];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, 'two-model-schema.graphql')];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot, {
                            name: fnName,
                            functionTemplate: 'Hello World',
                            additionalPermissions: {
                                permissions: ['storage'],
                                choices: ['api', 'function', 'storage'],
                                resources: ['Comment:@model(appsync)'],
                                resourceChoices: ['Post:@model(appsync)', 'Comment:@model(appsync)'],
                                operations: ['read'],
                            },
                        }, 'nodejs')];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projRoot, undefined, true)];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=function_5.test.js.map