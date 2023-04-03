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
exports.runInSequential = exports.testSubscription = exports.testSubscriptions = exports.testQuery = exports.testQueries = exports.testMutation = exports.testMutations = exports.updateSchemaInTestProject = exports.runMultiAutTest = exports.runAuthTest = exports.runTest = void 0;
/* eslint-disable */
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var graphql_tag_1 = __importDefault(require("graphql-tag"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var authHelper_1 = require("./authHelper");
var GROUPNAME = 'Admin';
var USERNAME = 'user1';
var PASSWORD = 'user1Password';
function runTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        var awsconfig, apiKey, appSyncClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projectDir, { transformerVersion: 1 })];
                case 1:
                    _a.sent();
                    updateSchemaInTestProject(projectDir, testModule.schema);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 2:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    apiKey = (0, authHelper_1.getApiKey)(projectDir);
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientAPIKeyAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);
                    return [4 /*yield*/, testMutations(testModule, appSyncClient)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, testQueries(testModule, appSyncClient)];
                case 4:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runTest = runTest;
function runAuthTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        var awsconfig, userPoolId, user, appSyncClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projectDir, {
                        'Amazon Cognito User Pool': {},
                        transformerVersion: 1,
                    })];
                case 1:
                    _a.sent();
                    updateSchemaInTestProject(projectDir, testModule.schema);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthAddUserGroups)(projectDir, [GROUPNAME])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 3:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    userPoolId = (0, authHelper_1.getUserPoolId)(projectDir);
                    return [4 /*yield*/, (0, authHelper_1.setupUser)(userPoolId, USERNAME, PASSWORD, GROUPNAME)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, authHelper_1.signInUser)(USERNAME, PASSWORD)];
                case 5:
                    user = _a.sent();
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientCognitoAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, user);
                    return [4 /*yield*/, testMutations(testModule, appSyncClient)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, testQueries(testModule, appSyncClient)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, testSubscriptions(testModule, appSyncClient)];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runAuthTest = runAuthTest;
function runMultiAutTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        var awsconfig, userPoolId, user, appSyncClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projectDir, {
                        'API key': {},
                        'Amazon Cognito User Pool': {},
                        IAM: {},
                        transformerVersion: 1,
                    })];
                case 1:
                    _a.sent();
                    updateSchemaInTestProject(projectDir, testModule.schema);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthAddUserGroups)(projectDir, [GROUPNAME])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 3:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    userPoolId = (0, authHelper_1.getUserPoolId)(projectDir);
                    return [4 /*yield*/, (0, authHelper_1.setupUser)(userPoolId, USERNAME, PASSWORD, GROUPNAME)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, authHelper_1.signInUser)(USERNAME, PASSWORD)];
                case 5:
                    user = _a.sent();
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientCognitoAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, user);
                    return [4 /*yield*/, testMutations(testModule, appSyncClient)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, testQueries(testModule, appSyncClient)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, testSubscriptions(testModule, appSyncClient)];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runMultiAutTest = runMultiAutTest;
function updateSchemaInTestProject(projectDir, schema) {
    var backendApiDirPath = path_1.default.join(projectDir, 'amplify', 'backend', 'api');
    var apiResDirName = fs_extra_1.default.readdirSync(backendApiDirPath)[0];
    var backendSchemaFilePath = path_1.default.join(backendApiDirPath, apiResDirName, 'schema.graphql');
    fs_extra_1.default.writeFileSync(backendSchemaFilePath, schema);
}
exports.updateSchemaInTestProject = updateSchemaInTestProject;
function testMutations(testModule, appSyncClient) {
    return __awaiter(this, void 0, void 0, function () {
        var mutationNames, mutationTasks;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mutationNames = Object.keys(testModule).filter(function (key) { return /^mutation[0-9]*$/.test(key); });
                    if (mutationNames.length > 1) {
                        mutationNames = mutationNames.sort(function (name1, name2) {
                            var n1 = parseInt(name1.replace(/mutation/, ''));
                            var n2 = parseInt(name2.replace(/mutation/, ''));
                            return n1 - n2;
                        });
                    }
                    mutationTasks = [];
                    mutationNames.forEach(function (mutationName) {
                        var mutation = testModule[mutationName];
                        var mutationInput = testModule["input_".concat(mutationName)];
                        var mutationResult = testModule["expected_result_".concat(mutationName)];
                        mutationTasks.push(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, testMutation(appSyncClient, mutation, mutationInput, mutationResult)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    return [4 /*yield*/, runInSequential(mutationTasks)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.testMutations = testMutations;
function testMutation(appSyncClient, mutation, mutationInput, mutationResult) {
    return __awaiter(this, void 0, void 0, function () {
        var resultMatch, errorMatch, actualResponse, result, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    resultMatch = true;
                    errorMatch = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, appSyncClient.mutate({
                            mutation: (0, graphql_tag_1.default)(mutation),
                            fetchPolicy: 'no-cache',
                            variables: mutationInput,
                        })];
                case 2:
                    result = _a.sent();
                    if (!checkResult(result, mutationResult)) {
                        actualResponse = result;
                        resultMatch = false;
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    if (!checkError(err_1, mutationResult)) {
                        actualResponse = err_1;
                        errorMatch = false;
                    }
                    return [3 /*break*/, 4];
                case 4:
                    if (!resultMatch || !errorMatch) {
                        console.log('The following mutation test failed.');
                        console.log('Mutation: ', mutation);
                        if (mutationInput) {
                            console.log('Mutation input: ', mutationInput);
                        }
                        if (mutationResult) {
                            console.log('Expected mutation result: ', mutationResult);
                        }
                        if (actualResponse) {
                            console.log('Actual mutation response: ', actualResponse);
                        }
                        throw new Error('Mutation test failed.');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.testMutation = testMutation;
function testQueries(testModule, appSyncClient) {
    return __awaiter(this, void 0, void 0, function () {
        var queryNames, queryTasks;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryNames = Object.keys(testModule).filter(function (key) { return /^query[0-9]*$/.test(key); });
                    if (queryNames.length > 1) {
                        queryNames = queryNames.sort(function (name1, name2) {
                            var n1 = parseInt(name1.replace(/query/, ''));
                            var n2 = parseInt(name2.replace(/query/, ''));
                            return n1 - n2;
                        });
                    }
                    queryTasks = [];
                    queryNames.forEach(function (queryName) {
                        var query = testModule[queryName];
                        var queryInput = testModule["input_".concat(queryName)];
                        var queryResult = testModule["expected_result_".concat(queryName)];
                        queryTasks.push(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, testQuery(appSyncClient, query, queryInput, queryResult)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    return [4 /*yield*/, runInSequential(queryTasks)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.testQueries = testQueries;
function testQuery(appSyncClient, query, queryInput, queryResult) {
    return __awaiter(this, void 0, void 0, function () {
        var resultMatch, errorMatch, actualResponse, result, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    resultMatch = true;
                    errorMatch = true;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, appSyncClient.query({
                            query: (0, graphql_tag_1.default)(query),
                            fetchPolicy: 'no-cache',
                            variables: queryInput,
                        })];
                case 2:
                    result = _a.sent();
                    if (!checkResult(result, queryResult)) {
                        actualResponse = result;
                        resultMatch = false;
                    }
                    return [3 /*break*/, 4];
                case 3:
                    err_2 = _a.sent();
                    if (!checkError(err_2, queryResult)) {
                        actualResponse = err_2;
                        errorMatch = false;
                    }
                    return [3 /*break*/, 4];
                case 4:
                    if (!resultMatch || !errorMatch) {
                        console.log('The following query test failed.');
                        console.log('Query: ', query);
                        if (queryInput) {
                            console.log('Query input: ', queryInput);
                        }
                        if (queryResult) {
                            console.log('Expected query result: ', queryResult);
                        }
                        if (actualResponse) {
                            console.log('Actual query response: ', actualResponse);
                        }
                        throw new Error('Query test failed.');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.testQuery = testQuery;
function testSubscriptions(testModule, appsyncClient) {
    return __awaiter(this, void 0, void 0, function () {
        var subscriptionNames, subscriptionTasks;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    subscriptionNames = Object.keys(testModule).filter(function (key) { return /^subscription[0-9]*$/.test(key); });
                    if (subscriptionNames.length > 1) {
                        subscriptionNames = subscriptionNames.sort(function (name1, name2) {
                            var n1 = parseInt(name1.replace(/subscription/, ''));
                            var n2 = parseInt(name2.replace(/subscription/, ''));
                            return n1 - n2;
                        });
                    }
                    subscriptionTasks = [];
                    subscriptionNames.forEach(function (subscriptionName) {
                        var subscription = testModule[subscriptionName];
                        var subscriptionInput = testModule["input_".concat(subscriptionName)];
                        var subscriptionResult = testModule["expected_result_".concat(subscriptionName)];
                        var mutations = testModule["mutations_".concat(subscriptionName)];
                        var mutationsInput = testModule["input_mutations_".concat(subscriptionName)];
                        subscriptionTasks.push(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, testSubscription(appsyncClient, subscription, mutations, subscriptionResult, subscriptionInput, mutationsInput)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    });
                    return [4 /*yield*/, runInSequential(subscriptionTasks)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.testSubscriptions = testSubscriptions;
function testSubscription(appSyncClient, subscription, mutations, subscriptionResult, subscriptionInput, mutationInputs) {
    return __awaiter(this, void 0, void 0, function () {
        var observer, received, sub, mutationTasks, _loop_1, i;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    observer = appSyncClient.subscribe({
                        query: (0, graphql_tag_1.default)(subscription),
                        variables: subscriptionInput,
                    });
                    received = [];
                    sub = observer.subscribe(function (event) {
                        received.push(event.data);
                    });
                    return [4 /*yield*/, new Promise(function (res) { return setTimeout(function () { return res(); }, 4000); })];
                case 1:
                    _a.sent();
                    mutationTasks = [];
                    _loop_1 = function (i) {
                        var mutation = mutations[i];
                        var mutationInput = mutationInputs ? mutationInputs[i] : undefined;
                        mutationTasks.push(function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, appSyncClient.mutate({
                                            mutation: (0, graphql_tag_1.default)(mutation),
                                            fetchPolicy: 'no-cache',
                                            variables: mutationInput,
                                        })];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, new Promise(function (res) { return setTimeout(function () { return res(); }, 4000); })];
                                    case 2:
                                        _a.sent(); // to ensure correct order in received data
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                    };
                    for (i = 0; i < mutations.length; i++) {
                        _loop_1(i);
                    }
                    return [4 /*yield*/, runInSequential(mutationTasks)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (res) { return setTimeout(function () { return res(); }, 4000); })];
                case 3:
                    _a.sent();
                    sub.unsubscribe();
                    if (!checkResult(received, subscriptionResult)) {
                        console.log('The following subscription test failed.');
                        console.log('Subscription: ', subscription);
                        if (subscriptionResult) {
                            console.log('Expected subscription result: ', subscriptionResult);
                        }
                        if (received) {
                            console.log('Actual subscription response: ', received);
                        }
                        throw new Error('Subscription test failed.');
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.testSubscription = testSubscription;
function checkResult(received, expected) {
    if (!expected) {
        // the test does not request result check, as long as the mutation/query goes through, it's good
        return true;
    }
    var queue = [
        {
            received: received,
            expected: expected,
            depth: 0,
        },
    ];
    try {
        return runCompare(queue);
    }
    catch (e) {
        console.log('checkResult error: ', e);
        return false;
    }
}
function checkError(received, expected) {
    if (!expected) {
        // the test does not request result check, assume mutation/query should go through, but received error
        return false;
    }
    var queue = [
        {
            received: received,
            expected: expected,
            depth: 0,
        },
    ];
    return runCompare(queue);
}
var MAX_DEPTH = 50;
var UUID_REGEX = /[0-9a-f]{8}\b-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-\b[0-9a-f]{12}/;
function runCompare(queue) {
    var result = true;
    var _loop_2 = function () {
        var itemToCompare = queue.shift();
        if (itemToCompare.depth > MAX_DEPTH) {
            return "break";
        }
        if (typeof itemToCompare.expected === 'object') {
            if (itemToCompare.expected === null) {
                result = itemToCompare.received === null;
            }
            else if (itemToCompare.received === null) {
                result = false;
            }
            else if (typeof itemToCompare.received === 'object') {
                Object.keys(itemToCompare.expected).forEach(function (key) {
                    queue.push({
                        received: itemToCompare.received[key],
                        expected: itemToCompare.expected[key],
                        depth: itemToCompare.depth + 1,
                    });
                });
            }
            else {
                result = false;
            }
        }
        else if (itemToCompare.expected === '<check-defined>') {
            result = itemToCompare.received !== null && itemToCompare.received !== undefined;
        }
        else if (itemToCompare.expected === '<uuid>:<username>') {
            var itemPrefix = itemToCompare.received.split(':')[0];
            result = itemPrefix.match(UUID_REGEX);
        }
        else {
            result = itemToCompare.received === itemToCompare.expected;
        }
    };
    while (queue.length > 0 && result) {
        var state_1 = _loop_2();
        if (state_1 === "break")
            break;
    }
    return result;
}
function runInSequential(tasks) {
    return __awaiter(this, void 0, void 0, function () {
        var result, _i, tasks_1, task;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, tasks_1 = tasks;
                    _a.label = 1;
                case 1:
                    if (!(_i < tasks_1.length)) return [3 /*break*/, 4];
                    task = tasks_1[_i];
                    return [4 /*yield*/, task(result)];
                case 2:
                    result = _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, result];
            }
        });
    });
}
exports.runInSequential = runInSequential;
/* eslint-enable */
//# sourceMappingURL=common.js.map