"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var lodash_1 = __importDefault(require("lodash"));
describe('go function tests', function () {
    var helloWorldSuccessOutput = 'Hello Amplify!';
    var projRoot;
    var funcName;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('go-functions')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 2:
                    _a.sent();
                    funcName = "gotestfn".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            name: funcName,
                            functionTemplate: 'Hello World',
                        }, 'go')];
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
    it('add go hello world function and mock locally', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.functionMockAssert)(projRoot, {
                        funcName: funcName,
                        successString: helloWorldSuccessOutput,
                        eventFile: 'src/event.json',
                    })];
                case 1:
                    _a.sent(); // will throw if successString is not in output
                    return [2 /*return*/];
            }
        });
    }); });
    it('add go hello world function and invoke in the cloud', function () { return __awaiter(void 0, void 0, void 0, function () {
        var payload, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = '{"name":"Amplify"}';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: funcName, payload: payload })];
                case 2:
                    response = _a.sent();
                    expect(JSON.parse(response.Payload.toString())).toEqual(helloWorldSuccessOutput);
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('python function tests', function () {
    var statusCode = 200;
    var headers = {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    };
    var message = 'Hello from your new Amplify Python lambda!';
    var helloWorldSuccessOutput = {
        statusCode: statusCode,
        headers: headers,
        body: message,
    };
    var projRoot;
    var funcName;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('py-functions')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 2:
                    _a.sent();
                    funcName = "pytestfn".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            name: funcName,
                            functionTemplate: 'Hello World',
                        }, 'python')];
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
    it('add python hello world and mock locally', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.functionMockAssert)(projRoot, {
                        funcName: funcName,
                        successString: helloWorldSuccessOutput.body,
                        eventFile: 'src/event.json',
                        timeout: 120,
                    })];
                case 1:
                    _a.sent(); // will throw if successString is not in output
                    return [2 /*return*/];
            }
        });
    }); });
    it('add python hello world and invoke in the cloud', function () { return __awaiter(void 0, void 0, void 0, function () {
        var payload, response, helloWorldSuccessOutputCloud;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = '{"test":"event"}';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: funcName, payload: payload })];
                case 2:
                    response = _a.sent();
                    helloWorldSuccessOutputCloud = __assign(__assign({}, helloWorldSuccessOutput), { body: JSON.stringify(helloWorldSuccessOutput.body) });
                    expect(JSON.parse(response.Payload.toString())).toEqual(JSON.parse(JSON.stringify(helloWorldSuccessOutputCloud)));
                    return [2 /*return*/];
            }
        });
    }); });
});
describe('dotnet function tests', function () {
    var helloWorldSuccessObj = {
        key1: 'VALUE1',
        key2: 'VALUE2',
        key3: 'VALUE3',
    };
    var helloWorldSuccessString = '  "key3": "VALUE3"';
    var projRoot;
    var funcName;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('dotnet-functions')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 2:
                    _a.sent();
                    funcName = "dotnettestfn".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            name: funcName,
                            functionTemplate: 'Hello World',
                        }, 'dotnetCore31')];
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
    it('add dotnet hello world function and mock locally', function () { return __awaiter(void 0, void 0, void 0, function () {
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
    it('add dotnet hello world function and invoke in the cloud', function () { return __awaiter(void 0, void 0, void 0, function () {
        var payload, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = '{"key1":"value1","key2":"value2","key3":"value3"}';
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
describe('nodejs function tests', function () {
    var helloWorldSuccessString = 'Hello from Lambda!';
    var helloWorldSuccessObj = {
        statusCode: 200,
        body: '"Hello from Lambda!"',
    };
    var projRoot;
    var funcName;
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)('nodejs-functions')];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                case 2:
                    _a.sent();
                    funcName = "nodejstestfn".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            name: funcName,
                            functionTemplate: 'Hello World',
                        }, 'nodejs')];
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
    it('add nodejs hello world function and mock locally', function () { return __awaiter(void 0, void 0, void 0, function () {
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
    it('add nodejs hello world function and invoke in the cloud', function () { return __awaiter(void 0, void 0, void 0, function () {
        var payload, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    payload = '{"key1":"value1","key2":"value2","key3":"value3"}';
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
    it('add nodejs hello world function and mock locally, check buildType, push, check buildType', function () { return __awaiter(void 0, void 0, void 0, function () {
        var meta, functionResource, lastDevBuildTimeStampBeforePush;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.functionMockAssert)(projRoot, {
                        funcName: funcName,
                        successString: helloWorldSuccessString,
                        eventFile: 'src/event.json',
                    })];
                case 1:
                    _a.sent(); // will throw if successString is not in output
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                    functionResource = lodash_1.default.get(meta, ['function', funcName]);
                    lastDevBuildTimeStampBeforePush = functionResource.lastDevBuildTimeStamp;
                    // Mock should trigger a DEV build of the function
                    expect(functionResource).toBeDefined();
                    expect(functionResource.lastBuildType).toEqual('DEV');
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 2:
                    _a.sent();
                    meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projRoot);
                    functionResource = lodash_1.default.get(meta, ['function', funcName]);
                    // Push should trigger a PROD build of the function
                    expect(functionResource.lastBuildType).toEqual('PROD');
                    expect(functionResource.lastDevBuildTimeStamp).toEqual(lastDevBuildTimeStampBeforePush);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=function_3.test.js.map