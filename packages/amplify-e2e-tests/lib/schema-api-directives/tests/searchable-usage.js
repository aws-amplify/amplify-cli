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
exports.expected_result_query2 = exports.query2 = exports.expected_result_query1 = exports.query1 = exports.expected_result_mutation = exports.mutation = exports.schema = exports.runTest = void 0;
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var authHelper_1 = require("../authHelper");
var common_1 = require("../common");
function runTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        var awsconfig, apiKey, appSyncClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projectDir, { transformerVersion: 1 })];
                case 1:
                    _a.sent();
                    (0, common_1.updateSchemaInTestProject)(projectDir, testModule.schema);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (res) { return setTimeout(function () { return res(); }, 60000); })];
                case 3:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    apiKey = (0, authHelper_1.getApiKey)(projectDir);
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientAPIKeyAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);
                    return [4 /*yield*/, (0, common_1.testMutations)(testModule, appSyncClient)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, new Promise(function (res) { return setTimeout(function () { return res(); }, 60000); })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, common_1.testQueries)(testModule, appSyncClient)];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runTest = runTest;
//schema
exports.schema = "\ntype Post @model @searchable {\n  id: ID!\n  title: String!\n  createdAt: String!\n  updatedAt: String!\n  upvotes: Int\n}";
//mutations
exports.mutation = "\nmutation CreatePost {\n  createPost(input: { title: \"Stream me to Elasticsearch!\" }) {\n    id\n    title\n    createdAt\n    updatedAt\n    upvotes\n  }\n}";
exports.expected_result_mutation = {
    data: {
        createPost: {
            id: '<check-defined>',
            title: 'Stream me to Elasticsearch!',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
            upvotes: null,
        },
    },
};
//queries
//#error: add "s" for searchPosts
exports.query1 = "\n#error: add \"s\" for searchPosts\nquery SearchPosts {\n  searchPosts(filter: { title: { match: \"Stream\" }}) {\n    items {\n      id\n      title\n    }\n  }\n}";
exports.expected_result_query1 = {
    data: {
        searchPosts: {
            items: [
                {
                    id: '<check-defined>',
                    title: 'Stream me to Elasticsearch!',
                },
            ],
        },
    },
};
exports.query2 = "\n#error: add \"s\" for searchPosts\nquery SearchPosts {\n  searchPosts(filter: { title: { wildcard: \"S*Elasticsearch!\" }}) {\n    items {\n      id\n      title\n    }\n  }\n}";
//#error: wildcard is not working properly, the query does not contain the expected items
exports.expected_result_query2 = {
    data: {
        searchPosts: {
            items: [],
        },
    },
};
//# sourceMappingURL=searchable-usage.js.map