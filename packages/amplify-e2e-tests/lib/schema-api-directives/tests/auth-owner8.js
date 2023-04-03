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
exports.expected_result_query = exports.query = exports.expected_result_mutation = exports.input_mutation = exports.mutation = exports.schema = exports.runTest = void 0;
/* eslint-disable */
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var authHelper_1 = require("../authHelper");
var common_1 = require("../common");
var GROUPNAME = 'Admin';
var USERNAME = 'user1';
var PASSWORD = 'user1Password';
function runTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        var awsconfig, userPoolId, user, appSyncClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projectDir, {
                        'Amazon Cognito User Pool': {},
                        transformerVersion: 2,
                    })];
                case 1:
                    _a.sent();
                    (0, common_1.updateSchemaInTestProject)(projectDir, testModule.schema);
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
                    return [4 /*yield*/, (0, common_1.testMutations)(testModule, appSyncClient)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, common_1.testQueries)(testModule, appSyncClient)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, common_1.testSubscriptions)(testModule, appSyncClient)];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runTest = runTest;
// schema
exports.schema = "\n# The simplest case\ntype Post @model @auth(rules: [{allow: owner}]) {\n  id: ID!\n  title: String!\n}\n##owner1";
// mutations
exports.mutation = "\nmutation CreatePost(\n    $input: CreatePostInput!\n    $condition: ModelPostConditionInput\n  ) {\n    createPost(input: $input, condition: $condition) {\n      id\n      title\n      createdAt\n      updatedAt\n      owner\n    }\n}";
exports.input_mutation = {
    input: {
        id: '1',
        title: 'title1',
    },
};
exports.expected_result_mutation = {
    data: {
        createPost: {
            id: '1',
            title: 'title1',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
            owner: USERNAME,
        },
    },
};
// queries
exports.query = "\n query GetPost {\n    getPost(id: \"1\") {\n      id\n      title\n      owner\n    }\n  }";
exports.expected_result_query = {
    data: {
        getPost: {
            id: '1',
            title: 'title1',
            owner: USERNAME,
        },
    },
};
/* eslint-enable */
//# sourceMappingURL=auth-owner8.js.map