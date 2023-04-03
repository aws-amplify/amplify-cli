"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getAppClientIDWeb = exports.getUserPoolIssUrl = exports.authenticateUser = exports.getApiKey = exports.getCognitoResourceName = exports.getUserPoolId = exports.getAWSExports = exports.configureAmplify = exports.signInUser = exports.getConfiguredAppsyncClientIAMAuth = exports.getConfiguredAppsyncClientAPIKeyAuth = exports.getConfiguredAppsyncClientOIDCAuth = exports.getConfiguredAppsyncClientCognitoAuth = exports.getConfiguredCognitoClient = exports.addUserToGroup = exports.setupUser = void 0;
var aws_sdk_1 = require("aws-sdk");
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var aws_amplify_1 = __importStar(require("aws-amplify"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var aws_appsync_1 = __importStar(require("aws-appsync"));
var tempPassword = 'tempPassword';
//setupUser will add user to a cognito group and make its status to be "CONFIRMED",
//if groupName is specified, add the user to the group.
function setupUser(userPoolId, username, password, groupName) {
    return __awaiter(this, void 0, void 0, function () {
        var cognitoClient;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    cognitoClient = getConfiguredCognitoClient();
                    return [4 /*yield*/, cognitoClient
                            .adminCreateUser({
                            UserPoolId: userPoolId,
                            UserAttributes: [{ Name: 'email', Value: 'username@amazon.com' }],
                            Username: username,
                            MessageAction: 'SUPPRESS',
                            TemporaryPassword: tempPassword,
                        })
                            .promise()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, authenticateUser(username, tempPassword, password)];
                case 2:
                    _a.sent();
                    if (!groupName) return [3 /*break*/, 4];
                    return [4 /*yield*/, cognitoClient
                            .adminAddUserToGroup({
                            UserPoolId: userPoolId,
                            Username: username,
                            GroupName: groupName,
                        })
                            .promise()];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.setupUser = setupUser;
function addUserToGroup(cognitoClient, userPoolId, username, groupName) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, cognitoClient
                        .adminAddUserToGroup({
                        UserPoolId: userPoolId,
                        Username: username,
                        GroupName: groupName,
                    })
                        .promise()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.addUserToGroup = addUserToGroup;
function getConfiguredCognitoClient() {
    var cognitoClient = new aws_sdk_1.CognitoIdentityServiceProvider({ apiVersion: '2016-04-19', region: process.env.CLI_REGION });
    var awsconfig = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN,
        region: process.env.CLI_REGION,
    };
    cognitoClient.config.update(awsconfig);
    return cognitoClient;
}
exports.getConfiguredCognitoClient = getConfiguredCognitoClient;
function getConfiguredAppsyncClientCognitoAuth(url, region, user) {
    return new aws_appsync_1.default({
        url: url,
        region: region,
        disableOffline: true,
        auth: {
            type: aws_appsync_1.AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
            jwtToken: user.signInUserSession.idToken.jwtToken,
        },
    });
}
exports.getConfiguredAppsyncClientCognitoAuth = getConfiguredAppsyncClientCognitoAuth;
function getConfiguredAppsyncClientOIDCAuth(url, region, user) {
    return new aws_appsync_1.default({
        url: url,
        region: region,
        disableOffline: true,
        auth: {
            type: aws_appsync_1.AUTH_TYPE.OPENID_CONNECT,
            jwtToken: user.signInUserSession.idToken.jwtToken,
        },
    });
}
exports.getConfiguredAppsyncClientOIDCAuth = getConfiguredAppsyncClientOIDCAuth;
function getConfiguredAppsyncClientAPIKeyAuth(url, region, apiKey) {
    return new aws_appsync_1.default({
        url: url,
        region: region,
        disableOffline: true,
        auth: {
            type: aws_appsync_1.AUTH_TYPE.API_KEY,
            apiKey: apiKey,
        },
    });
}
exports.getConfiguredAppsyncClientAPIKeyAuth = getConfiguredAppsyncClientAPIKeyAuth;
function getConfiguredAppsyncClientIAMAuth(url, region) {
    return new aws_appsync_1.default({
        url: url,
        region: region,
        disableOffline: true,
        auth: {
            type: aws_appsync_1.AUTH_TYPE.AWS_IAM,
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                sessionToken: process.env.AWS_SESSION_TOKEN,
            },
        },
    });
}
exports.getConfiguredAppsyncClientIAMAuth = getConfiguredAppsyncClientIAMAuth;
function signInUser(username, password) {
    return __awaiter(this, void 0, void 0, function () {
        var user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, aws_amplify_1.Auth.signIn(username, password)];
                case 1:
                    user = _a.sent();
                    return [2 /*return*/, user];
            }
        });
    });
}
exports.signInUser = signInUser;
function configureAmplify(projectDir) {
    var awsconfig = getAWSExports(projectDir);
    aws_amplify_1.default.configure(awsconfig);
    return awsconfig;
}
exports.configureAmplify = configureAmplify;
function getAWSExports(projectDir) {
    var awsExportsFilePath = path_1.default.join(projectDir, 'src', 'aws-exports.js');
    var fileContent = fs_extra_1.default.readFileSync(awsExportsFilePath).toString();
    fileContent = '{' + fileContent.split('= {')[1].split('};')[0] + '}';
    return JSON.parse(fileContent);
}
exports.getAWSExports = getAWSExports;
function getUserPoolId(projectDir) {
    var amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(projectDir);
    var cognitoResource = Object.values(amplifyMeta.auth).find(function (res) {
        return res.service === 'Cognito';
    });
    return cognitoResource.output.UserPoolId;
}
exports.getUserPoolId = getUserPoolId;
function getCognitoResourceName(projectDir) {
    var amplifyMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectDir);
    var cognitoResourceName = Object.keys(amplifyMeta.auth).find(function (key) {
        return amplifyMeta.auth[key].service === 'Cognito';
    });
    return cognitoResourceName;
}
exports.getCognitoResourceName = getCognitoResourceName;
function getApiKey(projectDir) {
    var amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(projectDir);
    var appsyncResource = Object.values(amplifyMeta.api).find(function (res) {
        return res.service === 'AppSync';
    });
    return appsyncResource.output.GraphQLAPIKeyOutput;
}
exports.getApiKey = getApiKey;
function authenticateUser(username, tempPassword, password) {
    return __awaiter(this, void 0, void 0, function () {
        var signinResult, requiredAttributes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, aws_amplify_1.Auth.signIn(username, tempPassword)];
                case 1:
                    signinResult = _a.sent();
                    if (!(signinResult.challengeName === 'NEW_PASSWORD_REQUIRED')) return [3 /*break*/, 3];
                    requiredAttributes = signinResult.challengeParam.requiredAttributes;
                    return [4 /*yield*/, aws_amplify_1.Auth.completeNewPassword(signinResult, password, requiredAttributes)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.authenticateUser = authenticateUser;
function getUserPoolIssUrl(projectDir) {
    var amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(projectDir);
    var cognitoResource = Object.values(amplifyMeta.auth).find(function (res) {
        return res.service === 'Cognito';
    });
    var userPoolId = cognitoResource.output.UserPoolId;
    var region = amplifyMeta.providers.awscloudformation.Region;
    return "https://cognito-idp.".concat(region, ".amazonaws.com/").concat(userPoolId, "/");
}
exports.getUserPoolIssUrl = getUserPoolIssUrl;
function getAppClientIDWeb(projectDir) {
    var amplifyMeta = (0, amplify_e2e_core_1.getProjectMeta)(projectDir);
    var cognitoResource = Object.values(amplifyMeta.auth).find(function (res) {
        return res.service === 'Cognito';
    });
    return cognitoResource.output.AppClientIDWeb;
}
exports.getAppClientIDWeb = getAppClientIDWeb;
//# sourceMappingURL=authHelper.js.map