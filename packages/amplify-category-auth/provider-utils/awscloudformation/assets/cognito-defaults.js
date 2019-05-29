const uuid = require('uuid');
const {
  booleanOptions,
  oAuthScopes,
} = require('./string-maps');

const [sharedId] = uuid().split('-');

const roles = {
  authRoleName: {
    Ref: 'AuthRoleName',
  },
  unauthRoleName: {
    Ref: 'UnauthRoleName',
  },
  authRoleArn: {
    'Fn::GetAtt': [
      'AuthRole',
      'Arn',
    ],
  },
  unauthRoleArn: {
    'Fn::GetAtt': [
      'UnauthRole',
      'Arn',
    ],
  },
};

const generalDefaults = projectName => ({
  resourceName: `${projectName}${sharedId}`,
  authSelections: 'identityPoolAndUserPool',
  ...roles,
});

const userPoolDefaults = (projectName) => {
  const projectNameTruncated = `${projectName.substring(0, 6)}${sharedId}`;
  return ({
    userPoolName: `${projectName}_userpool_${sharedId}`,
    autoVerifiedAttributes: ['email'],
    mfaConfiguration: 'OFF',
    mfaTypes: ['SMS Text Message'],
    roleName: `${projectNameTruncated}_sns-role`,
    roleExternalId: `${projectNameTruncated}_role_external_id`,
    policyName: `${projectNameTruncated}-sns-policy`,
    smsAuthenticationMessage: 'Your authentication code is {####}',
    smsVerificationMessage: 'Your verification code is {####}',
    emailVerificationSubject: 'Your verification code',
    emailVerificationMessage: 'Your verification code is {####}',
    defaultPasswordPolicy: booleanOptions.find(b => b.value === false).value,
    passwordPolicyMinLength: 8,
    passwordPolicyCharacters: [
    ],
    requiredAttributes: ['email'],
    userpoolClientName: `${projectNameTruncated}_app_client`,
    userpoolClientGenerateSecret: true,
    userpoolClientRefreshTokenValidity: 30,
    userpoolClientWriteAttributes: ['email'],
    userpoolClientReadAttributes: ['email'],
    mfaLambdaRole: `${projectNameTruncated}_totp_lambda_role`,
    mfaLambdaLogPolicy: `${projectNameTruncated}_totp_lambda_log_policy`,
    mfaPassRolePolicy: `${projectNameTruncated}_totp_pass_role_policy`,
    mfaLambdaIAMPolicy: `${projectNameTruncated}_totp_lambda_iam_policy`,
    userpoolClientLambdaRole: `${projectNameTruncated}_userpoolclient_lambda_role`,
    userpoolClientLogPolicy: `${projectNameTruncated}_userpoolclient_lambda_log_policy`,
    userpoolClientLambdaPolicy: `${projectNameTruncated}_userpoolclient_lambda_iam_policy`,
    userpoolClientSetAttributes: false,
  });
};

const withSocialDefaults = projectName => ({
  hostedUI: true,
  hostedUIDomainName: `${projectName}-${sharedId}`,
  AllowedOAuthFlows: ['code'],
  AllowedOAuthScopes: oAuthScopes.map(i => i.value),
});

const identityPoolDefaults = (projectName) => {
  const projectNameTruncated = `${projectName.substring(0, 6)}_${sharedId}`;
  return ({
    identityPoolName: `${projectName}_identitypool_${sharedId}`,
    allowUnauthenticatedIdentities: booleanOptions.find(b => b.value === false).value,
    lambdaLogPolicy: `${projectNameTruncated}_lambda_log_policy`,
    openIdLambdaRoleName: `${projectNameTruncated}_openid_lambda_role`,
    openIdRolePolicy: `${projectNameTruncated}_openid_pass_role_policy`,
    openIdLambdaIAMPolicy: `${projectNameTruncated}_openid_lambda_iam_policy`,
    openIdLogPolicy: `${projectNameTruncated}_openid_lambda_log_policy`,
  });
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

const getAllDefaults = (name) => {
  const disallowedChars = /[^A-Za-z0-9_]+/g;
  let projectName = name.projectConfig ? `${name.projectConfig.projectName.toLowerCase().substring(0, 100)}${sharedId}` : name.substring(0, 100);
  projectName = projectName.replace(disallowedChars, '_');
  const target = generalDefaults(projectName);
  const sources = [
    userPoolDefaults(projectName),
    identityAndUserPoolDefaults(projectName),
    withSocialDefaults(projectName),
  ];

  return Object.assign(target, ...sources);
};

module.exports = {
  getAllDefaults,
  functionMap,
  generalDefaults,
  withSocialDefaults,
  entityKeys,
  roles,
};
