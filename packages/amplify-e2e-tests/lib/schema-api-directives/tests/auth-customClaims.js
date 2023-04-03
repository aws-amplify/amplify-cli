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
exports.expected_result_createPostMutation = exports.createPostMutation = exports.func = exports.schema = exports.updateTriggerHandler = exports.runTest = void 0;
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var authHelper_1 = require("../authHelper");
var common_1 = require("../common");
var GROUPNAME = 'Moderator';
var USERNAME = 'user1';
var PASSWORD = 'user1Password';
function runTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        var awsconfig, userPoolId, user, appSyncClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithPreTokenGenerationTrigger)(projectDir)];
                case 1:
                    _a.sent();
                    updateTriggerHandler(projectDir);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthAddUserGroups)(projectDir, [GROUPNAME])];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithCognitoUserPoolAuthTypeWhenAuthExists)(projectDir, { transformerVersion: 1 })];
                case 3:
                    _a.sent();
                    (0, common_1.updateSchemaInTestProject)(projectDir, testModule.schema);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 4:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    userPoolId = (0, authHelper_1.getUserPoolId)(projectDir);
                    return [4 /*yield*/, (0, authHelper_1.setupUser)(userPoolId, USERNAME, PASSWORD, GROUPNAME)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, (0, authHelper_1.signInUser)(USERNAME, PASSWORD)];
                case 6:
                    user = _a.sent();
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientCognitoAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, user);
                    return [4 /*yield*/, (0, common_1.testMutation)(appSyncClient, exports.createPostMutation, undefined, exports.expected_result_createPostMutation)];
                case 7:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runTest = runTest;
function updateTriggerHandler(projectDir) {
    var backendFunctionDirPath = path_1.default.join(projectDir, 'amplify', 'backend', 'function');
    var functionName = fs_extra_1.default.readdirSync(backendFunctionDirPath)[0];
    var triggerHandlerFilePath = path_1.default.join(backendFunctionDirPath, functionName, 'src', 'alter-claims.js');
    fs_extra_1.default.writeFileSync(triggerHandlerFilePath, exports.func);
}
exports.updateTriggerHandler = updateTriggerHandler;
//schema
exports.schema = "\n#error: two @model on type Post\n#change: removed on @model\n\ntype Post\n@model\n@auth(rules: [\n\t{allow: owner, identityClaim: \"user_id\"},\n\t{allow: groups, groups: [\"Moderator\"], groupClaim: \"user_groups\"}\n])\n{\n  id: ID!\n  owner: String\n  postname: String\n  content: String\n}\n\n##customClaims";
exports.func = "\nexports.handler = async event => {\n  event.response = {\n    claimsOverrideDetails: {\n      claimsToAddOrOverride: {\n        user_id: event.userName\n      }\n    }\n  };\n  return event;\n};\n";
exports.createPostMutation = "\nmutation CreatePost {\n  createPost(input: {\n    id: \"1\",\n    postname: \"post1\",\n    content: \"post1 content\"\n  }) {\n    id\n    owner\n    postname\n    content\n    createdAt\n    updatedAt\n  }\n}\n";
exports.expected_result_createPostMutation = {
    data: {
        createPost: {
            id: '1',
            owner: 'user1',
            postname: 'post1',
            content: 'post1 content',
            createdAt: '<check-defined>',
            updatedAt: '<check-defined>',
        },
    },
};
//# sourceMappingURL=auth-customClaims.js.map