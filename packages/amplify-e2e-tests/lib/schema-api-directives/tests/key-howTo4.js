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
exports.runTest = exports.expected_result_query5 = exports.query5 = exports.expected_result_query4 = exports.query4 = exports.expected_result_query3 = exports.query3 = exports.expected_result_query2 = exports.query2 = exports.expected_result_query1 = exports.query1 = exports.mutation4 = exports.mutation3 = exports.mutation2 = exports.mutation1 = exports.schema = exports.schemaName = void 0;
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var authHelper_1 = require("../authHelper");
var common_1 = require("../common");
//schema
exports.schemaName = 'selective_sync.graphql';
exports.schema = "\ntype Comment @model\n@key(name: \"byUsername\", fields: [\"username\", \"createdAt\"], queryField: \"commentsByUsername\")\n@key(name: \"byeditor\", fields: [\"editor\", \"createdAt\"], queryField: \"commentsByeditors\")\n{\n  id: ID!\n  content: String\n  username: String!\n  createdAt: String!\n  editor: String!\n  data1: String\n  data2: String\n}\n\n##key/howTo4";
//mutations
exports.mutation1 = "\n mutation CreateComment{\n    createComment(input: {\n        content: \"order1\",\n        username: \"user2\",\n        createdAt: \"2019-01-01T01:05:49.129Z\",\n        editor: \"user1\",\n        data1 : \"example1\",\n        data2 : \"example2\"\n  }) {\n      content\n      username\n      createdAt\n      editor\n      data1\n      data2\n    }\n  }";
exports.mutation2 = "\n  mutation CreateComment{\n     createComment(input: {\n         content: \"order2\",\n         username: \"user2\",\n         createdAt: \"2018-01-01T01:05:49.129Z\",\n         editor: \"user1\",\n         data1 : \"example3\",\n         data2 : \"example4\"\n   }) {\n       content\n       username\n       createdAt\n       editor\n       data1\n       data2\n     }\n   }";
exports.mutation3 = "\n   mutation CreateComment{\n      createComment(input: {\n          content: \"order3\",\n          username: \"user2\",\n          createdAt: \"2009-01-01T01:05:49.129Z\",\n          editor: \"user3\",\n          data1 : \"example5\",\n          data2 : \"example6\"\n    }) {\n        content\n        username\n        createdAt\n        editor\n        data1\n        data2\n      }\n    }";
exports.mutation4 = "\n    mutation CreateComment{\n       createComment(input: {\n           content: \"order1\",\n           username: \"user1\",\n           createdAt: \"2015-01-01T01:05:49.129Z\",\n           editor: \"user2\",\n           data1 : \"example1\",\n           data2 : \"example2\"\n     }) {\n         content\n         username\n         createdAt\n         editor\n         data1\n         data2\n       }\n     }";
//query1 with no filter
exports.query1 = "\nquery SyncComments {\n  syncComments(filter: {and: [{username: {eq: \"user2\"}}, {createdAt: {gt: \"2010-01-01T00:00Z\"}}]}) {\n    items {\n      content\n      createdAt\n      editor\n      data1\n      data2\n      editor\n      username\n    }\n  }\n}\n";
exports.expected_result_query1 = {
    data: {
        syncComments: {
            items: [
                {
                    content: 'order2',
                    username: 'user2',
                    createdAt: '2018-01-01T01:05:49.129Z',
                    editor: 'user1',
                    data1: 'example3',
                    data2: 'example4',
                },
                {
                    content: 'order1',
                    username: 'user2',
                    createdAt: '2019-01-01T01:05:49.129Z',
                    editor: 'user1',
                    data1: 'example1',
                    data2: 'example2',
                },
            ],
        },
    },
};
//query1 with filter
exports.query2 = "\nquery SyncComments {\n  syncComments(filter: {and: [{username: {eq: \"user2\"}}, {createdAt: {gt: \"2010-01-01T00:00Z\"}}, { content: {eq : \"order1\"}}]}) {\n    items {\n      content\n      createdAt\n      editor\n      data1\n      data2\n      editor\n      username\n    }\n  }\n}\n";
exports.expected_result_query2 = {
    data: {
        syncComments: {
            items: [
                {
                    content: 'order1',
                    username: 'user2',
                    createdAt: '2019-01-01T01:05:49.129Z',
                    editor: 'user1',
                    data1: 'example1',
                    data2: 'example2',
                },
            ],
        },
    },
};
//query1 with no PK and all filter
exports.query3 = "\nquery SyncComments {\n  syncComments(filter: {and: [ {createdAt : {gt : \"2019-01-01T00:00Z\"}}]}) {\n    items {\n      content\n      createdAt\n      editor\n      data1\n      data2\n      editor\n      username\n    }\n  }\n}\n";
exports.expected_result_query3 = {
    data: {
        syncComments: {
            items: [
                {
                    content: 'order1',
                    username: 'user2',
                    createdAt: '2019-01-01T01:05:49.129Z',
                    editor: 'user1',
                    data1: 'example1',
                    data2: 'example2',
                },
            ],
        },
    },
};
//query1 with no PK and "or" filter
exports.query4 = "\nquery SyncComments {\n  syncComments(filter: {and: [ {data1 : {lt : \"example4\"}},{username : {eq : \"user1\"}}]}) {\n    items {\n      content\n      createdAt\n      editor\n      data1\n      data2\n      editor\n      username\n    }\n  }\n}\n";
exports.expected_result_query4 = {
    data: {
        syncComments: {
            items: [
                {
                    content: 'order1',
                    username: 'user1',
                    createdAt: '2015-01-01T01:05:49.129Z',
                    editor: 'user2',
                    data1: 'example1',
                    data2: 'example2',
                },
            ],
        },
    },
};
//query1 with no and and or in filter object
exports.query5 = "\nquery SyncComments {\n  syncComments(filter: { data1 : {lt : \"example4\"}, username : {eq : \"user1\"}}) {\n    items {\n      content\n      createdAt\n      editor\n      data1\n      data2\n      editor\n      username\n    }\n  }\n}\n";
exports.expected_result_query5 = {
    data: {
        syncComments: {
            items: [
                {
                    content: 'order1',
                    username: 'user1',
                    createdAt: '2015-01-01T01:05:49.129Z',
                    editor: 'user2',
                    data1: 'example1',
                    data2: 'example2',
                },
            ],
        },
    },
};
function runTest(projectDir, testModule, appName) {
    return __awaiter(this, void 0, void 0, function () {
        var awsconfig, apiKey, appSyncClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithBlankSchemaAndConflictDetection)(projectDir, { transformerVersion: 1 })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projectDir, appName, testModule.schemaName)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 3:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    apiKey = (0, authHelper_1.getApiKey)(projectDir);
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientAPIKeyAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);
                    return [4 /*yield*/, (0, common_1.testMutations)(testModule, appSyncClient)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, common_1.testQueries)(testModule, appSyncClient)];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runTest = runTest;
//# sourceMappingURL=key-howTo4.js.map