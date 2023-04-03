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
describe('nodejs', function () {
    describe('amplify add function', function () {
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
        it('init a project and add simple function and uncomment cors header', function () { return __awaiter(void 0, void 0, void 0, function () {
            var functionName, meta, _a, functionArn, Name, region, cloudFunction, response, payload;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                    case 1:
                        _b.sent();
                        functionName = "testcorsfunction".concat((0, amplify_e2e_core_1.generateRandomShortId)());
                        process.env.AMPLIFY_CLI_LAMBDA_CORS_HEADER = 'true';
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World', name: functionName }, 'nodejs')];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.functionBuild)(projRoot)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                    case 4:
                        _b.sent();
                        meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                        _a = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output, functionArn = _a.Arn, Name = _a.Name, region = _a.Region;
                        expect(functionArn).toBeDefined();
                        expect(functionName).toBeDefined();
                        expect(region).toBeDefined();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.getFunction)(Name, region)];
                    case 5:
                        cloudFunction = _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.invokeFunction)(Name, JSON.stringify({}), region)];
                    case 6:
                        response = _b.sent();
                        payload = JSON.parse(response.Payload.toString());
                        expect(payload.headers['Access-Control-Allow-Origin']).toEqual('*');
                        expect(payload.headers['Access-Control-Allow-Headers']).toEqual('*');
                        expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
                        delete process.env.AMPLIFY_CLI_LAMBDA_CORS_HEADER;
                        return [2 /*return*/];
                }
            });
        }); });
        it('init a project and add simple function', function () { return __awaiter(void 0, void 0, void 0, function () {
            var meta, _a, functionArn, functionName, region, cloudFunction;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Hello World' }, 'nodejs')];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.functionBuild)(projRoot)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                    case 4:
                        _b.sent();
                        meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                        _a = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output, functionArn = _a.Arn, functionName = _a.Name, region = _a.Region;
                        expect(functionArn).toBeDefined();
                        expect(functionName).toBeDefined();
                        expect(region).toBeDefined();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.getFunction)(functionName, region)];
                    case 5:
                        cloudFunction = _b.sent();
                        expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
                        return [2 /*return*/];
                }
            });
        }); });
        it('graphql mutation should result in trigger called in minimal AppSync + trigger infra', function () { return __awaiter(void 0, void 0, void 0, function () {
            var meta, _a, functionArn, functionName, region, cloudFunction, createGraphQLPayload, appsyncResource, fireGqlRequestAndCheckLogs;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {
                            name: 'graphqltriggerinfra',
                        })];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { transformerVersion: 1 })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, 'graphqltriggerinfra', 'simple_model.graphql')];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Lambda trigger', triggerType: 'DynamoDB' }, 'nodejs', amplify_e2e_core_1.addLambdaTrigger)];
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
                        createGraphQLPayload = function (id, content) { return ({
                            query: "mutation{ createTodo(input:{id: ".concat(id, ", content:\"").concat(content, "\"}){ id, content }}"),
                            variables: null,
                        }); };
                        appsyncResource = Object.keys(meta.api).map(function (key) { return meta.api[key]; })[0];
                        return [4 /*yield*/, (0, amplify_e2e_core_1.retry)(function () { return (0, amplify_e2e_core_1.getEventSourceMappings)(functionName, region); }, function (res) { return res.length > 0 && res[0].State === 'Enabled'; })];
                    case 8:
                        _b.sent();
                        fireGqlRequestAndCheckLogs = function () { return __awaiter(void 0, void 0, void 0, function () {
                            var resp, id;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.appsyncGraphQLRequest)(appsyncResource, createGraphQLPayload(Math.round(Math.random() * 1000), 'amplify'))];
                                    case 1:
                                        resp = (_a.sent());
                                        id = resp.data.createTodo.id;
                                        if (!id) {
                                            return [2 /*return*/, false];
                                        }
                                        return [4 /*yield*/, (0, amplify_e2e_core_1.retry)(function () { return (0, amplify_e2e_core_1.getCloudWatchLogs)(region, "/aws/lambda/".concat(functionName)); }, function (logs) { return !!logs.find(function (logEntry) { return logEntry.message.includes("\"id\":{\"S\":\"".concat(id, "\"},\"content\":{\"S\":\"amplify\"}")); }); }, {
                                                stopOnError: false,
                                                times: 2,
                                            })];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/, true];
                                }
                            });
                        }); };
                        return [4 /*yield*/, (0, amplify_e2e_core_1.retry)(fireGqlRequestAndCheckLogs, function (res) { return res; }, {
                                stopOnError: false,
                                times: 2,
                            })];
                    case 9:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('records put into kinesis stream should result in trigger called in minimal kinesis + trigger infra', function () { return __awaiter(void 0, void 0, void 0, function () {
            var meta, _a, functionArn, functionName, region, cloudFunction, kinesisResource, fireKinesisRequestAndCheckLogs;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addKinesis)(projRoot, { rightName: "kinesisintegtest".concat((0, amplify_e2e_core_1.generateRandomShortId)()), wrongName: '$' })];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, { functionTemplate: 'Lambda trigger', triggerType: 'Kinesis' }, 'nodejs', amplify_e2e_core_1.addLambdaTrigger)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.functionBuild)(projRoot)];
                    case 4:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                    case 5:
                        _b.sent();
                        meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                        _a = Object.keys(meta.function).map(function (key) { return meta.function[key]; })[0].output, functionArn = _a.Arn, functionName = _a.Name, region = _a.Region;
                        expect(functionArn).toBeDefined();
                        expect(functionName).toBeDefined();
                        expect(region).toBeDefined();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.getFunction)(functionName, region)];
                    case 6:
                        cloudFunction = _b.sent();
                        expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
                        return [4 /*yield*/, (0, amplify_e2e_core_1.retry)(function () { return (0, amplify_e2e_core_1.getEventSourceMappings)(functionName, region); }, function (res) { return res.length > 0 && res[0].State === 'Enabled'; })];
                    case 7:
                        _b.sent();
                        kinesisResource = Object.keys(meta.analytics).map(function (key) { return meta.analytics[key]; })[0];
                        fireKinesisRequestAndCheckLogs = function () { return __awaiter(void 0, void 0, void 0, function () {
                            var resp, eventId;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.putKinesisRecords)('integtest', '0', kinesisResource.output.kinesisStreamId, meta.providers.awscloudformation.Region)];
                                    case 1:
                                        resp = _a.sent();
                                        if (!(resp.FailedRecordCount === 0 && resp.Records.length > 0)) {
                                            return [2 /*return*/, false];
                                        }
                                        eventId = "".concat(resp.Records[0].ShardId, ":").concat(resp.Records[0].SequenceNumber);
                                        return [4 /*yield*/, (0, amplify_e2e_core_1.retry)(function () { return (0, amplify_e2e_core_1.getCloudWatchLogs)(meta.providers.awscloudformation.Region, "/aws/lambda/".concat(functionName)); }, function (logs) { return !!logs.find(function (logEntry) { return logEntry.message.includes(eventId); }); }, {
                                                stopOnError: false,
                                                times: 2,
                                            })];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/, true];
                                }
                            });
                        }); };
                        return [4 /*yield*/, (0, amplify_e2e_core_1.retry)(fireKinesisRequestAndCheckLogs, function (res) { return res; }, {
                                stopOnError: false,
                                times: 2,
                            })];
                    case 8:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should fail with approp message when adding lambda triggers to unexisting resources', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                    case 1:
                        _a.sent();
                        // No AppSync resources have been configured in API category.
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                                functionTemplate: 'Lambda trigger',
                                triggerType: 'DynamoDB',
                                eventSource: 'AppSync',
                                expectFailure: true,
                            }, 'nodejs', amplify_e2e_core_1.addLambdaTrigger)];
                    case 2:
                        // No AppSync resources have been configured in API category.
                        _a.sent();
                        // There are no DynamoDB resources configured in your project currently
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                                functionTemplate: 'Lambda trigger',
                                triggerType: 'DynamoDB',
                                eventSource: 'DynamoDB',
                                expectFailure: true,
                            }, 'nodejs', amplify_e2e_core_1.addLambdaTrigger)];
                    case 3:
                        // There are no DynamoDB resources configured in your project currently
                        _a.sent();
                        // No Kinesis streams resource to select. Please use "amplify add analytics" command to create a new Kinesis stream
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                                functionTemplate: 'Lambda trigger',
                                triggerType: 'Kinesis',
                                expectFailure: true,
                            }, 'nodejs', amplify_e2e_core_1.addLambdaTrigger)];
                    case 4:
                        // No Kinesis streams resource to select. Please use "amplify add analytics" command to create a new Kinesis stream
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); });
        it('should init and deploy storage DynamoDB + Lambda trigger', function () { return __awaiter(void 0, void 0, void 0, function () {
            var meta, _a, table1Name, table1Arn, table1Region, table1StreamArn;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, {})];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addSimpleDDB)(projRoot, {})];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projRoot, {
                                functionTemplate: 'Lambda trigger',
                                triggerType: 'DynamoDB',
                                eventSource: 'DynamoDB',
                            }, 'nodejs', amplify_e2e_core_1.addLambdaTrigger)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(projRoot)];
                    case 4:
                        _b.sent();
                        meta = (0, amplify_e2e_core_1.getProjectMeta)(projRoot);
                        _a = Object.keys(meta.storage).map(function (key) { return meta.storage[key]; })[0].output, table1Name = _a.Name, table1Arn = _a.Arn, table1Region = _a.Region, table1StreamArn = _a.StreamArn;
                        expect(table1Name).toBeDefined();
                        expect(table1Arn).toBeDefined();
                        expect(table1Region).toBeDefined();
                        expect(table1StreamArn).toBeDefined();
                        return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=function_1.test.js.map