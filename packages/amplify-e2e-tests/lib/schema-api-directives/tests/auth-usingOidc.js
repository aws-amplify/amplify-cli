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
exports.schema = exports.runTest = void 0;
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var authHelper_1 = require("../authHelper");
var common_1 = require("../common");
var GROUPNAME = 'Admin';
var USERNAME = 'user1';
var PASSWORD = 'user1Password';
function runTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        var awsconfig, userPoolId, appSyncClientIAM, user, appSyncClientOIDC;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectDir)];
                case 1:
                    _a.sent(); //will use the cognito user pool as oidc provider
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthAddUserGroups)(projectDir, [GROUPNAME])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushWithoutCodegen)(projectDir)];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApi)(projectDir, {
                            'OpenID Connect': {
                                oidcProviderName: 'awscognitouserpool',
                                oidcProviderDomain: (0, authHelper_1.getUserPoolIssUrl)(projectDir),
                                oidcClientId: (0, authHelper_1.getAppClientIDWeb)(projectDir),
                                ttlaIssueInMillisecond: '3600000',
                                ttlaAuthInMillisecond: '3600000',
                            },
                            IAM: {},
                            transformerVersion: 1,
                        })];
                case 4:
                    _a.sent();
                    (0, common_1.updateSchemaInTestProject)(projectDir, testModule.schema);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 5:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    userPoolId = (0, authHelper_1.getUserPoolId)(projectDir);
                    return [4 /*yield*/, (0, authHelper_1.setupUser)(userPoolId, USERNAME, PASSWORD, GROUPNAME)];
                case 6:
                    _a.sent();
                    appSyncClientIAM = (0, authHelper_1.getConfiguredAppsyncClientIAMAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region);
                    return [4 /*yield*/, (0, authHelper_1.signInUser)(USERNAME, PASSWORD)];
                case 7:
                    user = _a.sent();
                    appSyncClientOIDC = (0, authHelper_1.getConfiguredAppsyncClientOIDCAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, user);
                    //test create post mutation with private iam provider
                    return [4 /*yield*/, (0, common_1.testMutation)(appSyncClientIAM, createPostMutation, undefined, expected_result_createPostMutation)];
                case 8:
                    //test create post mutation with private iam provider
                    _a.sent();
                    //test create profile mutation with oidc provider
                    return [4 /*yield*/, (0, common_1.testMutation)(appSyncClientOIDC, createProfileMutation, undefined, expected_result_createProfileMutation)];
                case 9:
                    //test create profile mutation with oidc provider
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runTest = runTest;
//schema
exports.schema = "\n# private authorization with provider override\n#error: InvalidDirectiveError: @auth directive with 'private' strategy only supports 'userPools' (default) and 'iam' providers,\n#but found 'oidc' assigned.\n#change: changed type Post's @auth provider from oidc to iam\ntype Post @model @auth(rules: [{allow: private, provider: iam}]) {\n  id: ID!\n  title: String!\n}\n\n# owner authorization with provider override\ntype Profile @model @auth(rules: [{allow: owner, provider: oidc, identityClaim: \"sub\"}]) {\n  id: ID!\n  displayNAme: String!\n}\n\n##authUsingOidc";
var createPostMutation = "\nmutation CreatePost {\n  createPost(input:{\n    id: \"1\",\n    title: \"title1\"\n  }) {\n    id\n    title\n    createdAt\n    updatedAt\n  }\n}\n";
var expected_result_createPostMutation = {
    data: {
        createPost: {
            id: '1',
            title: 'title1',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
var createProfileMutation = "\nmutation CreateProfile{\n  createProfile(input: {\n    id: \"1\",\n    displayNAme: \"displayName1\"\n  }) {\n    id\n    displayNAme\n    createdAt\n    updatedAt\n    owner\n  }\n}\n";
var expected_result_createProfileMutation = {
    data: {
        createProfile: {
            id: '1',
            displayNAme: 'displayName1',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
            owner: '<check-defined>',
        },
    },
};
//# sourceMappingURL=auth-usingOidc.js.map