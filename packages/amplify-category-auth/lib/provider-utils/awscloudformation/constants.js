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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyAdmin = exports.BothPools = exports.IdentityPool = exports.UserPool = exports.privateKeys = exports.immutableAttributes = exports.safeDefaults = exports.ENV_SPECIFIC_PARAMS = exports.roleMapLambdaFilePath = exports.openIdLambdaFilePath = exports.mfaLambdaFilePath = exports.oauthLambdaFilePath = exports.hostedUIProviderLambdaFilePath = exports.hostedUILambdaFilePath = exports.userPoolClientLambdaFilePath = exports.triggerRoot = exports.cfnTemplateRoot = exports.authTriggerAssetFilePath = exports.adminAuthAssetRoot = exports.resourcesRoot = exports.category = void 0;
const path = __importStar(require("path"));
exports.category = 'auth';
exports.resourcesRoot = path.normalize(path.join(__dirname, '../../../resources'));
exports.adminAuthAssetRoot = path.join(exports.resourcesRoot, 'adminAuth');
exports.authTriggerAssetFilePath = path.join(exports.resourcesRoot, 'lambda-function.js');
exports.cfnTemplateRoot = path.join(exports.resourcesRoot, 'cloudformation-templates');
exports.triggerRoot = path.normalize(path.join(__dirname, '../../../provider-utils/awscloudformation/triggers'));
exports.userPoolClientLambdaFilePath = path.join(exports.resourcesRoot, 'auth-custom-resource', 'userpoolclientLambda.js');
exports.hostedUILambdaFilePath = path.join(exports.resourcesRoot, 'auth-custom-resource', 'hostedUILambda.js');
exports.hostedUIProviderLambdaFilePath = path.join(exports.resourcesRoot, 'auth-custom-resource', 'hostedUIProviderLambda.js');
exports.oauthLambdaFilePath = path.join(exports.resourcesRoot, 'auth-custom-resource', 'oauthLambda.js');
exports.mfaLambdaFilePath = path.join(exports.resourcesRoot, 'auth-custom-resource', 'mfaLambda.js');
exports.openIdLambdaFilePath = path.join(exports.resourcesRoot, 'auth-custom-resource', 'openIdLambda.js');
exports.roleMapLambdaFilePath = path.join(exports.resourcesRoot, 'auth-custom-resource', 'role-map-lambda-function.js');
exports.ENV_SPECIFIC_PARAMS = [
    'facebookAppId',
    'facebookAppIdUserPool',
    'facebookAppSecretUserPool',
    'googleClientId',
    'googleIos',
    'googleAndroid',
    'googleAppIdUserPool',
    'googleAppSecretUserPool',
    'amazonAppId',
    'loginwithamazonAppIdUserPool',
    'loginwithamazonAppSecretUserPool',
    'appleAppId',
    'signinwithappleClientIdUserPool',
    'signinwithappleTeamIdUserPool',
    'signinwithappleKeyIdUserPool',
    'signinwithapplePrivateKeyUserPool',
    'hostedUIProviderCreds',
];
exports.safeDefaults = [
    'allowUnauthenticatedIdentities',
    'thirdPartyAuth',
    'authProviders',
    'smsAuthenticationMessage',
    'emailVerificationSubject',
    'emailVerificationMessage',
    'smsVerificationMessage',
    'passwordPolicyMinLength',
    'passwordPolicyCharacters',
    'userpoolClientRefreshTokenValidity',
];
exports.immutableAttributes = [
    'resourceName',
    'userPoolName',
    'identityPoolName',
    'usernameAttributes',
    'requiredAttributes',
    'usernameCaseSensitive',
];
exports.privateKeys = [
    'facebookAppIdUserPool',
    'facebookAuthorizeScopes',
    'facebookAppSecretUserPool',
    'googleAppIdUserPool',
    'googleAuthorizeScopes',
    'googleAppSecretUserPool',
    'loginwithamazonAppIdUserPool',
    'loginwithamazonAuthorizeScopes',
    'loginwithamazonAppSecretUserPool',
    'signinwithappleClientIdUserPool',
    'signinwithappleTeamIdUserPool',
    'signinwithappleKeyIdUserPool',
    'signinwithapplePrivateKeyUserPool',
    'CallbackURLs',
    'LogoutURLs',
    'AllowedOAuthFlows',
    'AllowedOAuthScopes',
    'EditURLS',
    'newCallbackURLs',
    'addCallbackOnUpdate',
    'updateFlow',
    'newCallbackURLs',
    'selectedParties',
    'newLogoutURLs',
    'editLogoutURLs',
    'addLogoutOnUpdate',
    'additionalQuestions',
];
exports.UserPool = 'User Pool';
exports.IdentityPool = 'Identity Pool';
exports.BothPools = `${exports.UserPool} and ${exports.IdentityPool}`;
exports.AmplifyAdmin = 'Amplify Studio';
//# sourceMappingURL=constants.js.map