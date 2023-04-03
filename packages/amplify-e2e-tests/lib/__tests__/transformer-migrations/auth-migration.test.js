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
var graphql_tag_1 = __importDefault(require("graphql-tag"));
var moment_1 = __importDefault(require("moment"));
var aws_sdk_1 = require("aws-sdk");
var schema_api_directives_1 = require("../../schema-api-directives");
global.fetch = require('node-fetch');
describe('transformer @auth migration test', function () {
    var projRoot;
    var projectName;
    var BUILD_TIMESTAMP = (0, moment_1.default)().format('YYYYMMDDHHmmss');
    var GROUPNAME = 'Admin';
    var PASSWORD = 'user1Password';
    var NEW_PASSWORD = 'user1Password!!!**@@@';
    var EMAIL = 'username@amazon.com';
    var UNAUTH_ROLE_NAME = "unauthRole".concat(BUILD_TIMESTAMP);
    var modelSchemaV1 = 'transformer_migration/auth-model-v1.graphql';
    var modelSchemaV2 = 'transformer_migration/auth-model-v2.graphql';
    beforeEach(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    projectName = (0, amplify_e2e_core_1.createRandomName)();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.createNewProjectDir)(projectName)];
                case 1:
                    projRoot = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.initJSProjectWithProfile)(projRoot, { name: projectName })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithoutSchema)(projRoot, { apiName: projectName, transformerVersion: 1 })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiWithMultiAuth)(projRoot, {})];
                case 4:
                    _a.sent();
                    (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, modelSchemaV1);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthAddUserGroups)(projRoot, [GROUPNAME])];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projRoot)];
                case 6:
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
    it('migration of queries with different auth methods should succeed', function () { return __awaiter(void 0, void 0, void 0, function () {
        var iamHelper, awsconfig, userPoolId, user, apiKey, appSyncClientViaUser, appSyncClientViaApiKey, appSyncClientViaIAM, createPostMutation, createPostResult, createPostPublicMutation, createPostPublicResult, createPostPublicIAMMutation, createPostPublicIAMResult, createSalaryMutation, createSalaryResult, postsQuery, queryResult, postPublicsQuery, salaryQuery;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    iamHelper = new aws_sdk_1.IAM({ region: 'us-east-2' });
                    awsconfig = (0, schema_api_directives_1.configureAmplify)(projRoot);
                    userPoolId = (0, schema_api_directives_1.getUserPoolId)(projRoot);
                    return [4 /*yield*/, (0, schema_api_directives_1.setupUser)(userPoolId, EMAIL, PASSWORD)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, schema_api_directives_1.signInUser)(EMAIL, PASSWORD)];
                case 2:
                    user = _a.sent();
                    apiKey = (0, schema_api_directives_1.getApiKey)(projRoot);
                    appSyncClientViaUser = (0, schema_api_directives_1.getConfiguredAppsyncClientCognitoAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, user);
                    appSyncClientViaApiKey = (0, schema_api_directives_1.getConfiguredAppsyncClientAPIKeyAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);
                    appSyncClientViaIAM = (0, schema_api_directives_1.getConfiguredAppsyncClientIAMAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region);
                    createPostMutation = "\n      mutation CreatePost {\n        createPost(input: { title: \"Created in V1\" }) {\n          id\n        }\n      }\n    ";
                    return [4 /*yield*/, appSyncClientViaUser.mutate({
                            mutation: (0, graphql_tag_1.default)(createPostMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 3:
                    createPostResult = _a.sent();
                    expect(createPostResult.errors).toBeUndefined();
                    expect(createPostResult.data).toBeDefined();
                    createPostPublicMutation = "\n      mutation CreatePostPublic {\n        createPostPublic(input: { title: \"Created in V1\" }) {\n          id\n        }\n      }\n    ";
                    return [4 /*yield*/, appSyncClientViaApiKey.mutate({
                            mutation: (0, graphql_tag_1.default)(createPostPublicMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 4:
                    createPostPublicResult = _a.sent();
                    expect(createPostPublicResult.errors).toBeUndefined();
                    expect(createPostPublicResult.data).toBeDefined();
                    createPostPublicIAMMutation = "\n      mutation CreatePostPublicIAM {\n        createPostPublicIAM(input: { title: \"Created in V1\" }) {\n          id\n        }\n      }\n    ";
                    return [4 /*yield*/, appSyncClientViaIAM.mutate({
                            mutation: (0, graphql_tag_1.default)(createPostPublicIAMMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 5:
                    createPostPublicIAMResult = _a.sent();
                    expect(createPostPublicIAMResult.errors).toBeUndefined();
                    expect(createPostPublicIAMResult.data).toBeDefined();
                    createSalaryMutation = "\n      mutation CreateSalary {\n        createSalary(input: { wage: 1000000000 }) {\n          id\n          owner\n        }\n      }\n    ";
                    return [4 /*yield*/, appSyncClientViaUser.mutate({
                            mutation: (0, graphql_tag_1.default)(createSalaryMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 6:
                    createSalaryResult = _a.sent();
                    expect(createSalaryResult.errors).toBeUndefined();
                    expect(createSalaryResult.data).toBeDefined();
                    (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'transformerVersion', 2);
                    (0, amplify_e2e_core_1.addFeatureFlag)(projRoot, 'graphqltransformer', 'useExperimentalPipelinedTransformer', true);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateApiSchema)(projRoot, projectName, modelSchemaV2)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushUpdate)(projRoot)];
                case 8:
                    _a.sent();
                    appSyncClientViaUser = (0, schema_api_directives_1.getConfiguredAppsyncClientCognitoAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, user);
                    createPostMutation = /* GraphQL */ "\n      mutation CreatePost {\n        createPost(input: { title: \"Created in V2\" }) {\n          id\n        }\n      }\n    ";
                    return [4 /*yield*/, appSyncClientViaUser.mutate({
                            mutation: (0, graphql_tag_1.default)(createPostMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 9:
                    createPostResult = _a.sent();
                    expect(createPostResult.errors).toBeUndefined();
                    expect(createPostResult.data).toBeDefined();
                    apiKey = (0, schema_api_directives_1.getApiKey)(projRoot);
                    appSyncClientViaApiKey = (0, schema_api_directives_1.getConfiguredAppsyncClientAPIKeyAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);
                    createPostPublicMutation = /* GraphQL */ "\n      mutation CreatePostPublic {\n        createPostPublic(input: { title: \"Created in V1\" }) {\n          id\n        }\n      }\n    ";
                    return [4 /*yield*/, appSyncClientViaApiKey.mutate({
                            mutation: (0, graphql_tag_1.default)(createPostPublicMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 10:
                    createPostPublicResult = _a.sent();
                    expect(createPostPublicResult.errors).toBeUndefined();
                    expect(createPostPublicResult.data).toBeDefined();
                    createSalaryMutation = /* GraphQL */ "\n      mutation CreateSalary {\n        createSalary(input: { wage: 1000000000 }) {\n          id\n          owner\n        }\n      }\n    ";
                    return [4 /*yield*/, appSyncClientViaUser.mutate({
                            mutation: (0, graphql_tag_1.default)(createSalaryMutation),
                            fetchPolicy: 'no-cache',
                        })];
                case 11:
                    createSalaryResult = _a.sent();
                    expect(createSalaryResult.errors).toBeUndefined();
                    expect(createSalaryResult.data).toBeDefined();
                    postsQuery = "\n      query ListPosts {\n        listPosts {\n          items {\n            id\n            title\n          }\n        }\n      }\n    ";
                    return [4 /*yield*/, appSyncClientViaUser.query({
                            query: (0, graphql_tag_1.default)(postsQuery),
                            fetchPolicy: 'no-cache',
                        })];
                case 12:
                    queryResult = _a.sent();
                    expect(queryResult.errors).toBeUndefined();
                    expect(queryResult.data).toBeDefined();
                    expect(queryResult.data.listPosts.items.length).toEqual(2);
                    postPublicsQuery = "\n      query ListPostPublics {\n        listPostPublics {\n          items {\n            id\n            title\n          }\n        }\n      }\n    ";
                    return [4 /*yield*/, appSyncClientViaApiKey.query({
                            query: (0, graphql_tag_1.default)(postPublicsQuery),
                            fetchPolicy: 'no-cache',
                        })];
                case 13:
                    queryResult = _a.sent();
                    expect(queryResult.errors).toBeUndefined();
                    expect(queryResult.data).toBeDefined();
                    expect(queryResult.data.listPostPublics.items.length).toEqual(2);
                    salaryQuery = "\n      query ListSalary {\n        listSalaries {\n          items {\n            wage\n          }\n        }\n      }\n    ";
                    return [4 /*yield*/, appSyncClientViaUser.query({
                            query: (0, graphql_tag_1.default)(salaryQuery),
                            fetchPolicy: 'no-cache',
                        })];
                case 14:
                    queryResult = _a.sent();
                    expect(queryResult.errors).toBeUndefined();
                    expect(queryResult.data).toBeDefined();
                    expect(queryResult.data.listSalaries.items.length).toEqual(2);
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=auth-migration.test.js.map