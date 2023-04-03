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
exports.query = exports.schema = exports.func = exports.addFunctionWithAuthAccess = exports.runTest = void 0;
//special handling needed becasue we need to set up the function in a differnt region
var path_1 = __importDefault(require("path"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var functionTester_1 = require("../functionTester");
var authHelper_1 = require("../authHelper");
var common_1 = require("../common");
var functionTester_2 = require("../functionTester");
var GROUPNAME = 'Admin';
var USERNAME = 'user1';
var PASSWORD = 'user1Password';
function runTest(projectDir, testModule) {
    return __awaiter(this, void 0, void 0, function () {
        var functionName, awsconfig, userPoolId, user, appSyncClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthWithDefault)(projectDir)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, addFunctionWithAuthAccess(projectDir, testModule, 'func')];
                case 2:
                    functionName = _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addApiWithCognitoUserPoolAuthTypeWhenAuthExists)(projectDir, { transformerVersion: 1 })];
                case 3:
                    _a.sent();
                    (0, common_1.updateSchemaInTestProject)(projectDir, testModule.schema);
                    (0, functionTester_1.updateFunctionNameInSchema)(projectDir, '<function-name>', functionName);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.updateAuthAddUserGroups)(projectDir, [GROUPNAME])];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPush)(projectDir)];
                case 5:
                    _a.sent();
                    awsconfig = (0, authHelper_1.configureAmplify)(projectDir);
                    userPoolId = (0, authHelper_1.getUserPoolId)(projectDir);
                    return [4 /*yield*/, (0, authHelper_1.setupUser)(userPoolId, USERNAME, PASSWORD, GROUPNAME)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, (0, authHelper_1.signInUser)(USERNAME, PASSWORD)];
                case 7:
                    user = _a.sent();
                    appSyncClient = (0, authHelper_1.getConfiguredAppsyncClientCognitoAuth)(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, user);
                    return [4 /*yield*/, (0, common_1.testQueries)(testModule, appSyncClient)];
                case 8:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.runTest = runTest;
function addFunctionWithAuthAccess(projectDir, testModule, funcName) {
    return __awaiter(this, void 0, void 0, function () {
        var functionName, authResourceName, amplifyBackendDirPath, amplifyFunctionIndexFilePath, cognitoResourceNameUpperCase, userPoolIDEnvVarName, funcitonIndexFileContents, placeHolderRegex;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    functionName = (0, functionTester_2.randomizedFunctionName)(funcName);
                    authResourceName = (0, authHelper_1.getCognitoResourceName)(projectDir);
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addFunction)(projectDir, {
                            name: functionName,
                            functionTemplate: 'Hello World',
                            additionalPermissions: {
                                permissions: ['auth'],
                                choices: ['auth'],
                                resources: [authResourceName],
                                resourceChoices: [authResourceName],
                                operations: ['create', 'read', 'update', 'delete'],
                            },
                        }, 'nodejs')];
                case 1:
                    _a.sent();
                    amplifyBackendDirPath = path_1.default.join(projectDir, 'amplify', 'backend');
                    amplifyFunctionIndexFilePath = path_1.default.join(amplifyBackendDirPath, 'function', functionName, 'src', 'index.js');
                    fs_extra_1.default.writeFileSync(amplifyFunctionIndexFilePath, testModule[funcName]);
                    cognitoResourceNameUpperCase = (0, authHelper_1.getCognitoResourceName)(projectDir).toUpperCase();
                    userPoolIDEnvVarName = "AUTH_".concat(cognitoResourceNameUpperCase, "_USERPOOLID");
                    funcitonIndexFileContents = fs_extra_1.default.readFileSync(amplifyFunctionIndexFilePath).toString();
                    placeHolderRegex = new RegExp('AUTH_MYRESOURCENAME_USERPOOLID', 'g');
                    funcitonIndexFileContents = funcitonIndexFileContents.replace(placeHolderRegex, userPoolIDEnvVarName);
                    fs_extra_1.default.writeFileSync(amplifyFunctionIndexFilePath, funcitonIndexFileContents);
                    return [2 /*return*/, functionName];
            }
        });
    });
}
exports.addFunctionWithAuthAccess = addFunctionWithAuthAccess;
//functions
exports.func = "\n/* Amplify Params - DO NOT EDIT\nYou can access the following resource attributes as environment variables from your Lambda function\nvar environment = process.env.ENV\nvar region = process.env.REGION\nvar authMyResourceNameUserPoolId = process.env.AUTH_MYRESOURCENAME_USERPOOLID\n\nAmplify Params - DO NOT EDIT */\n\nconst { CognitoIdentityServiceProvider } = require('aws-sdk');\nconst cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider();\n\n/**\n * Get user pool information from environment variables.\n */\nconst COGNITO_USERPOOL_ID = process.env.AUTH_MYRESOURCENAME_USERPOOLID;\nif (!COGNITO_USERPOOL_ID) {\n  throw new Error(\"Function requires environment variable: 'COGNITO_USERPOOL_ID'\");\n}\nconst COGNITO_USERNAME_CLAIM_KEY = 'cognito:username';\n\n/**\n * Using this as the entry point, you can use a single function to handle many resolvers.\n */\nconst resolvers = {\n  Query: {\n    echo: ctx => {\n      return ctx.arguments.msg;\n    },\n    me: async ctx => {\n      var params = {\n        UserPoolId: COGNITO_USERPOOL_ID /* required */,\n        Username: ctx.identity.claims[COGNITO_USERNAME_CLAIM_KEY] /* required */,\n      };\n      try {\n        // Read more: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminGetUser-property\n        return await cognitoIdentityServiceProvider.adminGetUser(params).promise();\n      } catch (e) {\n        throw new Error('NOT FOUND');\n      }\n    },\n  },\n};\n\n// event\n// {\n//   \"typeName\": \"Query\", /* Filled dynamically based on @function usage location */\n//   \"fieldName\": \"me\", /* Filled dynamically based on @function usage location */\n//   \"arguments\": { /* GraphQL field arguments via $ctx.arguments */ },\n//   \"identity\": { /* AppSync identity object via $ctx.identity */ },\n//   \"source\": { /* The object returned by the parent resolver. E.G. if resolving field 'Post.comments', the source is the Post object. */ },\n//   \"request\": { /* AppSync request object. Contains things like headers. */ },\n//   \"prev\": { /* If using the built-in pipeline resolver support, this contains the object returned by the previous function. */ },\n// }\nexports.handler = async event => {\n  const typeHandler = resolvers[event.typeName];\n  if (typeHandler) {\n    const resolver = typeHandler[event.fieldName];\n    if (resolver) {\n      return await resolver(event);\n    }\n  }\n  throw new Error('Resolver not found.');\n};\n";
//schema
var env = '${env}';
exports.schema = "\n#change: replaced \"ResolverFunction\" with the \"<function-name>\" placeholder, the test will replace it with the actual function name\ntype Query {\n  me: User @function(name: \"<function-name>-".concat(env, "\")\n  echo(msg: String): String @function(name: \"<function-name>-").concat(env, "\")\n}\n# These types derived from https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CognitoIdentityServiceProvider.html#adminGetUser-property\ntype User {\n  Username: String!\n  UserAttributes: [Value]\n  UserCreateDate: String\n  UserLastModifiedDate: String\n  Enabled: Boolean\n  UserStatus: UserStatus\n  MFAOptions: [MFAOption]\n  PreferredMfaSetting: String\n  UserMFASettingList: String\n}\ntype Value {\n  Name: String!\n  Value: String\n}\ntype MFAOption {\n  DeliveryMedium: String\n  AttributeName: String\n}\nenum UserStatus {\n  UNCONFIRMED\n  CONFIRMED\n  ARCHIVED\n  COMPROMISED\n  UNKNOWN\n  RESET_REQUIRED\n  FORCE_CHANGE_PASSWORD\n}\n");
//queries
exports.query = "\nquery {\n  me {\n    Username\n    UserStatus\n    UserCreateDate\n    UserAttributes {\n      Name\n      Value\n    }\n    MFAOptions {\n      AttributeName\n      DeliveryMedium\n    }\n    Enabled\n    PreferredMfaSetting\n    UserMFASettingList\n    UserLastModifiedDate\n  }\n}\n";
//# sourceMappingURL=function-example2.js.map