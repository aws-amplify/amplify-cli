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
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var amplify_cli_core_1 = require("amplify-cli-core");
describe('dotnet function tests', function () {
    var helloWorldSuccessObj = {
        key1: 'VALUE1',
        key2: 'VALUE2',
        key3: 'VALUE3',
    };
    var helloWorldSuccessString = '  "key3": "VALUE3"';
    var serverlessSuccessString = '  "statusCode": 200,';
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
    var assertDotNetVersion = function () {
        var functionPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(projRoot, amplify_cli_core_1.AmplifyCategories.FUNCTION, funcName);
        var functionRuntime = amplify_cli_core_1.JSONUtilities.readJson(path_1.default.join(functionPath, 'amplify.state')).functionRuntime;
        expect(functionRuntime).toEqual('dotnet6');
        var functionProjFilePath = path_1.default.join(functionPath, 'src', "".concat(funcName, ".csproj"));
        var functionProjFileContent = fs_extra_1.default.readFileSync(functionProjFilePath, 'utf8');
        expect(functionProjFileContent).toContain('<TargetFramework>net6.0</TargetFramework>');
    };
    it('add dotnet hello world function and mock locally', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                        name: funcName,
                        functionTemplate: 'Hello World',
                    }, 'dotnet6')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionMockAssert)(projRoot, {
                            funcName: funcName,
                            successString: helloWorldSuccessString,
                            eventFile: 'src/event.json',
                        })];
                case 2:
                    _a.sent(); // will throw if successString is not in output
                    assertDotNetVersion();
                    return [2 /*return*/];
            }
        });
    }); });
    it('add dotnet hello world function and invoke in the cloud', function () { return __awaiter(void 0, void 0, void 0, function () {
        var payload, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                        name: funcName,
                        functionTemplate: 'Hello World',
                    }, 'dotnet6')];
                case 1:
                    _a.sent();
                    payload = '{"key1":"value1","key2":"value2","key3":"value3"}';
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: funcName, payload: payload })];
                case 3:
                    response = _a.sent();
                    expect(JSON.parse(response.Payload.toString())).toEqual(helloWorldSuccessObj);
                    assertDotNetVersion();
                    return [2 /*return*/];
            }
        });
    }); });
    it('add dotnet serverless function and mock locally', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                        name: funcName,
                        functionTemplate: 'Serverless',
                    }, 'dotnet6')];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionMockAssert)(projRoot, {
                            funcName: funcName,
                            successString: serverlessSuccessString,
                            eventFile: 'src/event.json',
                        })];
                case 2:
                    _a.sent(); // will throw if successString is not in output
                    assertDotNetVersion();
                    return [2 /*return*/];
            }
        });
    }); });
    it('add dotnet crud function and invoke in the cloud', function () { return __awaiter(void 0, void 0, void 0, function () {
        var payload, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                        name: funcName,
                        functionTemplate: 'CRUD function for DynamoDB (Integration with API Gateway)',
                    }, 'dotnet6', amplify_e2e_core_1.createNewDynamoDBForCrudTemplate)];
                case 1:
                    _a.sent();
                    payload = JSON.stringify({
                        body: null,
                        resource: '/items/{proxy+}',
                        path: '/items/column1:foo',
                        httpMethod: 'GET',
                    });
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionCloudInvoke)(projRoot, { funcName: funcName, payload: payload })];
                case 3:
                    response = _a.sent();
                    expect(JSON.parse(response.Payload.toString()).statusCode).toEqual(200);
                    assertDotNetVersion();
                    return [2 /*return*/];
            }
        });
    }); });
    it('add dotnet ddb trigger function and and mock locally', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addSimpleDDBwithGSI)(projRoot)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            name: funcName,
                            functionTemplate: 'Trigger (DynamoDb, Kinesis)',
                            triggerType: 'DynamoDB',
                            eventSource: 'DynamoDB',
                        }, 'dotnet6', amplify_e2e_core_1.addLambdaTrigger)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionMockAssert)(projRoot, {
                            funcName: funcName,
                            successString: null,
                            eventFile: 'src/event.json',
                        })];
                case 3:
                    _a.sent(); // will throw if successString is not in output
                    assertDotNetVersion();
                    return [2 /*return*/];
            }
        });
    }); });
    it('add dotnet kinesis trigger function and and mock locally', function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addKinesis)(projRoot, { rightName: "kinesisintegtest".concat((0, amplify_e2e_core_1.generateRandomShortId)()), wrongName: '$' })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                            name: funcName,
                            functionTemplate: 'Trigger (DynamoDb, Kinesis)',
                            triggerType: 'Kinesis',
                        }, 'dotnet6', amplify_e2e_core_1.addLambdaTrigger)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.functionMockAssert)(projRoot, {
                            funcName: funcName,
                            successString: null,
                            eventFile: 'src/event.json',
                        })];
                case 3:
                    _a.sent(); // will throw if successString is not in output
                    assertDotNetVersion();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=function_3b.test.js.map