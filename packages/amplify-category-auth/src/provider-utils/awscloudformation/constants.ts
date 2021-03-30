import * as path from 'path';

// path constants
export const resourcesRoot = path.normalize(path.join(__dirname, '../../../resources'));
export const adminAuthAssetRoot = path.join(resourcesRoot, 'adminAuth');
export const authTriggerAssetFilePath = path.join(resourcesRoot, 'lambda-function.js');
export const cfnTemplateRoot = path.join(resourcesRoot, 'cloudformation-templates');
export const triggerRoot = path.normalize(path.join(__dirname, '../../../provider-utils/awscloudformation/triggers'));

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
  'facebookAuthorizeScopes',
  'facebookAppSecretUserPool',
  'googleAppIdUserPool',
  'googleAuthorizeScopes',
  'googleAppSecretUserPool',
  'loginwithamazonAppIdUserPool',
  'loginwithamazonAuthorizeScopes',
  'loginwithamazonAppSecretUserPool',
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
