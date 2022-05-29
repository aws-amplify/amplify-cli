const uuid = require('uuid');
const { booleanOptions, oAuthScopes } = require('./string-maps');

const [sharedId] = uuid.v4().split('-');

const generalDefaults = projectName => ({
  sharedId,
  resourceName: `${projectName}${sharedId}`,
  resourceNameTruncated: `${projectName.substring(0, 6)}${sharedId}`,
  authSelections: 'identityPoolAndUserPool',
});

const userPoolDefaults = projectName => {
  const projectNameTruncated = `${projectName.substring(0, 6)}${sharedId}`;
  return {
    resourceNameTruncated: `${projectName.substring(0, 6)}${sharedId}`,
    userPoolName: `${projectName}_userpool_${sharedId}`,
    autoVerifiedAttributes: ['email'],
    mfaConfiguration: 'OFF',
    mfaTypes: ['SMS Text Message'],
    smsAuthenticationMessage: 'Your authentication code is {####}',
    smsVerificationMessage: 'Your verification code is {####}',
    emailVerificationSubject: 'Your verification code',
    emailVerificationMessage: 'Your verification code is {####}',
    defaultPasswordPolicy: false,
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: [],
    requiredAttributes: ['email'],
    aliasAttributes: [],
    userpoolClientGenerateSecret: false,
    userpoolClientRefreshTokenValidity: 30,
    userpoolClientWriteAttributes: ['email'],
    userpoolClientReadAttributes: ['email'],
    userpoolClientLambdaRole: `${projectNameTruncated}_userpoolclient_lambda_role`,
    userpoolClientSetAttributes: false,
  };
};

const withSocialDefaults = projectName => ({
  hostedUI: true,
  hostedUIDomainName: `${projectName.replace('_', '')}-${sharedId}`,
  AllowedOAuthFlows: ['code'],
  AllowedOAuthScopes: oAuthScopes.map(i => i.value),
});

const identityPoolDefaults = projectName => {
  // eslint-disable-line
  return {
    identityPoolName: `${projectName}_identitypool_${sharedId}`,
    allowUnauthenticatedIdentities: false,
  };
};

const identityAndUserPoolDefaults = projectName => ({
  // replace dashes with underscores for id pool regex constraint
  ...identityPoolDefaults(projectName),
  ...userPoolDefaults(projectName),
});

const functionMap = {
  userPoolOnly: userPoolDefaults,
  identityPoolAndUserPool: identityAndUserPoolDefaults,
  identityPoolOnly: identityPoolDefaults,
};

const entityKeys = {
  identityPoolKeys: Object.keys(identityPoolDefaults('')),
  userPoolKeys: Object.keys(userPoolDefaults('')),
};

const getAllDefaults = name => {
  const disallowedChars = /[^A-Za-z0-9_]+/g;
  let projectName = name.projectConfig
    ? `${name.projectConfig.projectName.toLowerCase().substring(0, 100)}${sharedId}`
    : name.substring(0, 100);
  projectName = projectName.replace(disallowedChars, '_');
  const target = generalDefaults(projectName);
  const sources = [userPoolDefaults(projectName), identityAndUserPoolDefaults(projectName), withSocialDefaults(projectName)];

  return Object.assign(target, ...sources);
};

module.exports = {
  getAllDefaults,
  functionMap,
  generalDefaults,
  withSocialDefaults,
  entityKeys,
  sharedId,
};
