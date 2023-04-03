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
describe('java function tests', function () {
    var helloWorldSuccessObj = {
        greetings: 'Hello John Doe!',
    };
    var helloWorldSuccessString = '  "greetings": "Hello John Doe!"';
    var projRoot;
    var funcName;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        var shortId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('java-functions')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 2:
                    _a.sent();
                    shortId = (0, uuid_1.v4)().split('-')[0];
                    funcName = "javatestfn".concat(shortId);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            name: funcName,
                            functionTemplate: 'Hello World',
                        }, 'java')];
                case 3:
                    _a.sent();
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
    it('add java hello world function and mock locally', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.functionMockAssert)(projRoot, {
                        funcName: funcName,
                        successString: helloWorldSuccessString,
                        eventFile: 'src/event.json',
                    })];
                case 1:
                    _a.sent(); // will throw if successString is not in output
                    return [2 /*return*/];
            }
        });
    }); });
    it('add java hello world function and invoke in the cloud', function () { return __awaiter(void 0, void 0, void 0, function () {
        var payload, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = '{"firstName":"John","lastName" : "Doe"}';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: funcName, payload: payload })];
                case 2:
                    response = _a.sent();
                    expect(JSON.parse(response.Payload.toString())).toEqual(helloWorldSuccessObj);
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('amplify add/update/remove function based on schedule rule', function () {
    var projRoot;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('schedule')];
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
    it('add a schedule rule for daily', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, _a, functionArn, functionName, region, ruleName, cloudFunction, ScheduleRuleName;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            schedulePermissions: {
                                interval: 'Daily',
                            },
                        }, 'nodejs')];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionBuild)(projRoot)];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 4:
                    _b.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output, functionArn = _a.Arn, functionName = _a.Name, region = _a.Region, ruleName = _a.CloudWatchEventRule;
                    expect(functionArn).toBeDefined();
                    expect(functionName).toBeDefined();
                    expect(region).toBeDefined();
                    expect(ruleName).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getFunction)(functionName, region)];
                case 5:
                    cloudFunction = _b.sent();
                    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getCloudWatchEventRule)(functionArn, meta.providers.awscloudformation.Region)];
                case 6:
                    ScheduleRuleName = _b.sent();
                    expect(ScheduleRuleName.RuleNames[0]).toEqual(ruleName);
                    return [2 /*return*/];
            }
        });
    }); });
    it('update a schedule rule for daily', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, _a, functionArn, functionName, region, ruleName, cloudFunction, ScheduleRuleName;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            schedulePermissions: {
                                interval: 'Daily',
                            },
                        }, 'nodejs')];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionBuild)(projRoot)];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            schedulePermissions: {
                                interval: 'Daily',
                                action: 'Update the schedule',
                            },
                        }, 'nodejs')];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 5:
                    _b.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output, functionArn = _a.Arn, functionName = _a.Name, region = _a.Region, ruleName = _a.CloudWatchEventRule;
                    expect(functionArn).toBeDefined();
                    expect(functionName).toBeDefined();
                    expect(region).toBeDefined();
                    expect(ruleName).toBeDefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getFunction)(functionName, region)];
                case 6:
                    cloudFunction = _b.sent();
                    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getCloudWatchEventRule)(functionArn, meta.providers.awscloudformation.Region)];
                case 7:
                    ScheduleRuleName = _b.sent();
                    expect(ScheduleRuleName.RuleNames[0]).toEqual(ruleName);
                    return [2 /*return*/];
            }
        });
    }); });
    it('remove a schedule rule for daily', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, _a, functionArn, functionName, region, ruleName, cloudFunction;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            schedulePermissions: {
                                interval: 'Daily',
                            },
                        }, 'nodejs')];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionBuild)(projRoot)];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateFunction)(projRoot, {
                            functionTemplate: 'Hello World',
                            schedulePermissions: {
                                interval: 'Daily',
                                action: 'Remove the schedule',
                            },
                        }, 'nodejs')];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 5:
                    _b.sent();
                    meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                    _a = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output, functionArn = _a.Arn, functionName = _a.Name, region = _a.Region, ruleName = _a.CloudWatchEventRule;
                    expect(functionArn).toBeDefined();
                    expect(functionName).toBeDefined();
                    expect(region).toBeDefined();
                    expect(ruleName).toBeUndefined();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.getFunction)(functionName, region)];
                case 6:
                    cloudFunction = _b.sent();
                    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=function_8.test.js.map