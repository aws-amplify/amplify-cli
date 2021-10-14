import * as path from 'path';

// category
export const category = 'auth';

// path constants
export const resourcesRoot = path.normalize(path.join(__dirname, '../../../resources'));
export const adminAuthAssetRoot = path.join(resourcesRoot, 'adminAuth');
export const authTriggerAssetFilePath = path.join(resourcesRoot, 'lambda-function.js');
export const cfnTemplateRoot = path.join(resourcesRoot, 'cloudformation-templates');
export const triggerRoot = path.normalize(path.join(__dirname, '../../../provider-utils/awscloudformation/triggers'));
export const userPoolClientLambdaFilePath = path.join(resourcesRoot, 'auth-custom-resource', 'userpoolclientLambda.js');
export const hostedUILambdaFilePath = path.join(resourcesRoot, 'auth-custom-resource', 'hostedUILambda.js');
export const hostedUIProviderLambdaFilePath = path.join(resourcesRoot, 'auth-custom-resource', 'hostedUIProviderLambda.js');
export const oauthLambdaFilePath = path.join(resourcesRoot, 'auth-custom-resource', 'oauthLambda.js');
export const mfaLambdaFilePath = path.join(resourcesRoot, 'auth-custom-resource', 'mfaLambda.js');
export const openIdLambdaFilePath = path.join(resourcesRoot, 'auth-custom-resource', 'openIdLambda.js');
export const roleMapLambdaFilePath = path.join(resourcesRoot, 'auth-custom-resource', 'role-map-lambda-function.js');
export const ENV_SPECIFIC_PARAMS = [
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

export const safeDefaults = [
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

// These attributes cannot be modified once the auth resource is created
export const immutableAttributes = [
  'resourceName',
  'userPoolName',
  'identityPoolName',
  'usernameAttributes',
  'requiredAttributes',
  'usernameCaseSensitive',
];

export const privateKeys = [
  'facebookAppIdUserPool',
  'facebookAppSecretUserPool',
  'googleAppIdUserPool',
  'googleAppSecretUserPool',
  'loginwithamazonAppIdUserPool',
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

// amplify console auth options
export const UserPool = 'User Pool';
export const IdentityPool = 'Identity Pool';
export const BothPools = `${UserPool} and ${IdentityPool}`;
export const AmplifyAdmin = 'Amplify admin UI';
