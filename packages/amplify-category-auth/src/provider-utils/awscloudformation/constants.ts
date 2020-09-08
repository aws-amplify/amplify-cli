import * as path from 'path';

// path constants
export const resourcesRoot = path.normalize(path.join(__dirname, '../../../resources'));
export const adminAuthAssetRoot = path.join(resourcesRoot, 'adminAuth');
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

export const protectedValues = [
  'resourceName',
  'userPoolName',
  'identityPoolName',
  'usernameAttributes',
  'autoVerifiedAttributes',
  'requiredAttributes',
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
