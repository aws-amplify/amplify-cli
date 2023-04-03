"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.setupOgProjectWithAuth = exports.deleteAppClient = exports.addAppClientWithoutSecret = exports.addAppClientWithSecret = exports.getDynamoDBResourceName = exports.getDynamoDBProjectDetails = exports.getOGDynamoDBProjectDetails = exports.getS3ResourceName = exports.getStorageProjectDetails = exports.getOGStorageProjectDetails = exports.readRootStack = exports.readResourceParametersJson = exports.getOGAuthProjectDetails = exports.getAuthProjectDetails = exports.getShortId = void 0;
var amplify_cli_core_1 = require("amplify-cli-core");
var amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
var aws = __importStar(require("aws-sdk"));
var fs = __importStar(require("fs-extra"));
var lodash_1 = __importDefault(require("lodash"));
var path = __importStar(require("path"));
var uuid_1 = require("uuid");
// eslint-disable-next-line import/no-cycle
var _1 = require(".");
var getShortId = function () {
    var shortId = (0, uuid_1.v4)().split('-')[0];
    return shortId;
};
exports.getShortId = getShortId;
var getAuthProjectDetails = function (projectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var team = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
    var authMetaKey = Object.keys(meta.auth)
        .filter(function (key) { return meta.auth[key].service === 'Cognito'; })
        .map(function (key) { return key; })[0];
    var authMeta = meta.auth[authMetaKey];
    // eslint-disable-next-line spellcheck/spell-checker
    var authTeam = lodash_1.default.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
    // eslint-disable-next-line spellcheck/spell-checker
    var providerTeam = lodash_1.default.get(team, ['integtest', 'awscloudformation']);
    var parameters = (0, exports.readResourceParametersJson)(projectRoot, 'auth', authMetaKey);
    var result = {
        authResourceName: authMetaKey,
        parameters: {
            authSelections: parameters.authSelections,
            resourceName: parameters.userPoolName,
        },
        meta: {
            UserPoolId: authMeta.output.UserPoolId,
            UserPoolName: authMeta.output.UserPoolName,
            AppClientID: authMeta.output.AppClientID,
            AppClientSecret: authMeta.output.AppClientSecret,
            AppClientIDWeb: authMeta.output.AppClientIDWeb,
            HostedUIDomain: authMeta.output.HostedUIDomain,
            OAuthMetadata: authMeta.output.OAuthMetadata ? JSON.parse(authMeta.output.OAuthMetadata) : undefined,
        },
        team: {
            userPoolId: authTeam.userPoolId,
            userPoolName: authTeam.userPoolName,
            webClientId: authTeam.webClientId,
            nativeClientId: authTeam.nativeClientId,
            hostedUIProviderCreds: authTeam.hostedUIProviderCreds ? JSON.parse(authTeam.hostedUIProviderCreds) : undefined,
        },
    };
    if (result.parameters.authSelections === 'identityPoolAndUserPool') {
        result.meta = __assign(__assign({}, result.meta), { IdentityPoolId: authMeta.output.IdentityPoolId, IdentityPoolName: authMeta.output.IdentityPoolName, AmazonWebClient: authMeta.output.AmazonWebClient, FacebookWebClient: authMeta.output.FacebookWebClient, GoogleWebClient: authMeta.output.GoogleWebClient });
        result.team = __assign(__assign({}, result.team), { identityPoolId: authMeta.output.IdentityPoolId, identityPoolName: authMeta.output.IdentityPoolName, allowUnauthenticatedIdentities: parameters.allowUnauthenticatedIdentities, authRoleArn: providerTeam.AuthRoleArn, authRoleName: providerTeam.AuthRoleName, unauthRoleArn: providerTeam.UnauthRoleArn, unauthRoleName: providerTeam.UnauthRoleName, amazonAppId: authTeam.amazonAppId, facebookAppId: authTeam.facebookAppId, googleClientId: authTeam.googleClientId });
    }
    return result;
};
exports.getAuthProjectDetails = getAuthProjectDetails;
var getOGAuthProjectDetails = function (projectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var team = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
    var authMetaKey = Object.keys(meta.auth)
        .filter(function (key) { return meta.auth[key].service === 'Cognito'; })
        .map(function (key) { return key; })[0];
    var authMeta = meta.auth[authMetaKey];
    // eslint-disable-next-line spellcheck/spell-checker
    var authTeam = lodash_1.default.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
    var parameters = (0, exports.readResourceParametersJson)(projectRoot, 'auth', authMetaKey);
    return {
        authResourceName: authMetaKey,
        parameters: {
            authSelections: parameters.authSelections,
            resourceName: parameters.userPoolName,
        },
        meta: {
            UserPoolId: authMeta.output.UserPoolId,
            UserPoolName: authMeta.output.UserPoolName,
            AppClientID: authMeta.output.AppClientID,
            AppClientSecret: authMeta.output.AppClientSecret,
            AppClientIDWeb: authMeta.output.AppClientIDWeb,
            HostedUIDomain: authMeta.output.HostedUIDomain,
            OAuthMetadata: authMeta.output.OAuthMetadata ? JSON.parse(authMeta.output.OAuthMetadata) : undefined,
            IdentityPoolId: authMeta.output.IdentityPoolId,
            IdentityPoolName: authMeta.output.IdentityPoolName,
        },
        team: {
            userPoolId: authMeta.output.UserPoolId,
            userPoolName: authMeta.output.UserPoolName,
            webClientId: authMeta.output.AppClientIDWeb,
            nativeClientId: authMeta.output.AppClientID,
            hostedUIProviderCreds: authTeam.hostedUIProviderCreds ? JSON.parse(authTeam.hostedUIProviderCreds) : undefined,
        },
    };
};
exports.getOGAuthProjectDetails = getOGAuthProjectDetails;
var readResourceParametersJson = function (projectRoot, category, resourceName) {
    var parametersFilePath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'parameters.json');
    var parametersFileBuildPath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'build', 'parameters.json');
    if (fs.existsSync(parametersFilePath)) {
        return amplify_cli_core_1.JSONUtilities.readJson(parametersFilePath);
    }
    if (fs.existsSync(parametersFileBuildPath)) {
        return amplify_cli_core_1.JSONUtilities.readJson(parametersFileBuildPath);
    }
    throw new Error("parameters.json doesn't exist");
};
exports.readResourceParametersJson = readResourceParametersJson;
var readRootStack = function (projectRoot) {
    var rootStackFilePath = path.join(projectRoot, 'amplify', 'backend', 'awscloudformation', 'build', 'root-cloudformation-stack.json');
    var rootStack = amplify_cli_core_1.JSONUtilities.readJson(rootStackFilePath);
    return rootStack;
};
exports.readRootStack = readRootStack;
var getOGStorageProjectDetails = function (projectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var storageMetaKey = Object.keys(meta.storage)
        .filter(function (key) { return meta.storage[key].service === 'S3'; })
        .map(function (key) { return key; })[0];
    var storageMeta = meta.storage[storageMetaKey];
    var parameters = (0, exports.readResourceParametersJson)(projectRoot, 'storage', storageMetaKey);
    return {
        storageResourceName: storageMetaKey,
        parameters: {
            resourceName: parameters.resourceName,
        },
        meta: {
            BucketName: storageMeta.output.BucketName,
            Region: storageMeta.output.Region,
        },
    };
};
exports.getOGStorageProjectDetails = getOGStorageProjectDetails;
var getStorageProjectDetails = function (projectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var team = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
    var storageMetaKey = Object.keys(meta.storage)
        .filter(function (key) { return meta.storage[key].service === 'S3'; })
        .map(function (key) { return key; })[0];
    var storageMeta = meta.storage[storageMetaKey];
    // eslint-disable-next-line spellcheck/spell-checker
    var storageTeam = lodash_1.default.get(team, ['integtest', 'categories', 'storage', storageMetaKey]);
    var parameters = (0, exports.readResourceParametersJson)(projectRoot, 'storage', storageMetaKey);
    var result = {
        storageResourceName: storageMetaKey,
        parameters: {
            resourceName: parameters.userPoolName,
        },
        meta: {
            BucketName: storageMeta.output.BucketName,
            Region: storageMeta.output.Region,
        },
        team: {
            bucketName: storageTeam.bucketName,
            region: storageTeam.region,
        },
    };
    return result;
};
exports.getStorageProjectDetails = getStorageProjectDetails;
var getS3ResourceName = function (projectRoot) {
    var amplifyMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var s3ResourceName = Object.keys(amplifyMeta.storage).find(function (key) { return amplifyMeta.storage[key].service === 'S3'; });
    return s3ResourceName;
};
exports.getS3ResourceName = getS3ResourceName;
var getOGDynamoDBProjectDetails = function (projectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var storageMetaKey = Object.keys(meta.storage)
        .filter(function (key) { return meta.storage[key].service === 'DynamoDB'; })
        .map(function (key) { return key; })[0];
    var storageMeta = meta.storage[storageMetaKey];
    var parameters = (0, exports.readResourceParametersJson)(projectRoot, 'storage', storageMetaKey);
    return {
        storageResourceName: storageMetaKey,
        parameters: {
            resourceName: parameters.resourceName,
        },
        meta: {
            Name: storageMeta.output.Name,
            Region: storageMeta.output.Region,
            PartitionKeyName: storageMeta.output.PartitionKeyName,
            PartitionKeyType: storageMeta.output.PartitionKeyType,
            SortKeyName: storageMeta.output.SortKeyName,
            SortKeyType: storageMeta.output.SortKeyType,
            Arn: storageMeta.output.Arn,
            StreamArn: storageMeta.output.StreamArn,
        },
    };
};
exports.getOGDynamoDBProjectDetails = getOGDynamoDBProjectDetails;
var getDynamoDBProjectDetails = function (projectRoot) {
    var meta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var team = (0, amplify_e2e_core_1.getTeamProviderInfo)(projectRoot);
    var storageMetaKey = Object.keys(meta.storage)
        .filter(function (key) { return meta.storage[key].service === 'DynamoDB'; })
        .map(function (key) { return key; })[0];
    var dynamodbMeta = meta.storage[storageMetaKey];
    // eslint-disable-next-line spellcheck/spell-checker
    var storageTeam = lodash_1.default.get(team, ['integtest', 'categories', 'storage', storageMetaKey]);
    var parameters = (0, exports.readResourceParametersJson)(projectRoot, 'storage', storageMetaKey);
    return {
        storageResourceName: storageMetaKey,
        parameters: {
            resourceName: parameters.resourceName,
        },
        meta: {
            Name: dynamodbMeta.output.Name,
            Region: dynamodbMeta.output.Region,
            PartitionKeyName: dynamodbMeta.output.PartitionKeyName,
            PartitionKeyType: dynamodbMeta.output.PartitionKeyType,
            SortKeyName: dynamodbMeta.output.SortKeyName,
            SortKeyType: dynamodbMeta.output.SortKeyType,
            Arn: dynamodbMeta.output.Arn,
            StreamArn: dynamodbMeta.output.StreamArn,
        },
        team: {
            tableName: storageTeam.tableName,
            region: storageTeam.region,
            partitionKeyName: storageTeam.partitionKeyName,
            partitionKeyType: storageTeam.partitionKeyType,
            sortKeyName: storageTeam.sortKeyName,
            sortKeyType: storageTeam.sortKeyType,
            arn: storageTeam.arn,
            streamArn: storageTeam.streamArn,
        },
    };
};
exports.getDynamoDBProjectDetails = getDynamoDBProjectDetails;
var getDynamoDBResourceName = function (projectRoot) {
    var amplifyMeta = (0, amplify_e2e_core_1.getBackendAmplifyMeta)(projectRoot);
    var dynamoDBResourceName = Object.keys(amplifyMeta.storage).find(function (key) { return amplifyMeta.storage[key].service === 'DynamoDB'; });
    return dynamoDBResourceName;
};
exports.getDynamoDBResourceName = getDynamoDBResourceName;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
var addAppClient = function (profileName, projectRoot, clientName, generateSecret, settings) { return __awaiter(void 0, void 0, void 0, function () {
    var projectDetails, authDetails, creds, cognitoClient, response;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                projectDetails = (0, amplify_e2e_core_1.getProjectMeta)(projectRoot);
                authDetails = (0, exports.getAuthProjectDetails)(projectRoot);
                creds = new aws.SharedIniFileCredentials({ profile: profileName });
                aws.config.credentials = creds;
                cognitoClient = new aws.CognitoIdentityServiceProvider({ region: projectDetails.providers.awscloudformation.Region });
                return [4 /*yield*/, cognitoClient
                        .createUserPoolClient({
                        ClientName: clientName,
                        UserPoolId: authDetails.meta.UserPoolId,
                        GenerateSecret: generateSecret,
                        AllowedOAuthFlows: settings.allowedOAuthFlows,
                        CallbackURLs: settings.callbackURLs,
                        LogoutURLs: settings.logoutURLs,
                        AllowedOAuthScopes: settings.allowedScopes,
                        SupportedIdentityProviders: settings.supportedIdentityProviders,
                        AllowedOAuthFlowsUserPoolClient: settings.allowedOAuthFlowsUserPoolClient,
                    })
                        .promise()];
            case 1:
                response = _a.sent();
                // eslint-disable-next-line spellcheck/spell-checker
                return [2 /*return*/, { appClientId: response.UserPoolClient.ClientId, appclientSecret: response.UserPoolClient.ClientSecret }];
        }
    });
}); };
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
var addAppClientWithSecret = function (profileName, projectRoot, clientName, settings) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, addAppClient(profileName, projectRoot, clientName, true, settings)];
}); }); };
exports.addAppClientWithSecret = addAppClientWithSecret;
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
var addAppClientWithoutSecret = function (profileName, projectRoot, clientName, settings) { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, addAppClient(profileName, projectRoot, clientName, false, settings)];
}); }); };
exports.addAppClientWithoutSecret = addAppClientWithoutSecret;
var deleteAppClient = function (profileName, projectRoot, clientId) { return __awaiter(void 0, void 0, void 0, function () {
    var authDetails, projectDetails, creds, cognitoClient;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                authDetails = (0, exports.getAuthProjectDetails)(projectRoot);
                projectDetails = (0, amplify_e2e_core_1.getProjectMeta)(projectRoot);
                creds = new aws.SharedIniFileCredentials({ profile: profileName });
                aws.config.credentials = creds;
                cognitoClient = new aws.CognitoIdentityServiceProvider({ region: projectDetails.providers.awscloudformation.Region });
                return [4 /*yield*/, cognitoClient.deleteUserPoolClient({ ClientId: clientId, UserPoolId: authDetails.meta.UserPoolId }).promise()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
exports.deleteAppClient = deleteAppClient;
/**
 * sets up a project with auth (UserPool only or UserPool & IdentityPool)
 */
var setupOgProjectWithAuth = function (ogProjectRoot, ogProjectSettings, withIdentityPool) {
    if (withIdentityPool === void 0) { withIdentityPool = false; }
    return __awaiter(void 0, void 0, void 0, function () {
        var ogShortId;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ogShortId = (0, exports.getShortId)();
                    if (!withIdentityPool) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthIdentityPoolAndUserPoolWithOAuth)(ogProjectRoot, (0, _1.createIDPAndUserPoolWithOAuthSettings)(ogProjectSettings.name, ogShortId))];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, (0, amplify_e2e_core_1.addAuthUserPoolOnlyWithOAuth)(ogProjectRoot, (0, _1.createUserPoolOnlyWithOAuthSettings)(ogProjectSettings.name, ogShortId))];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4: return [4 /*yield*/, (0, amplify_e2e_core_1.amplifyPushAuth)(ogProjectRoot)];
                case 5:
                    _a.sent();
                    return [2 /*return*/, (0, exports.getOGAuthProjectDetails)(ogProjectRoot)];
            }
        });
    });
};
exports.setupOgProjectWithAuth = setupOgProjectWithAuth;
//# sourceMappingURL=utilities.js.map