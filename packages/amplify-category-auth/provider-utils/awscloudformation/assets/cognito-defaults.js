const uuid = require('uuid');
const { coreAttributes, appClientReadAttributes, booleanOptions } = require('./string-maps');

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

const generalDefaults = () => ({
  resourceName: `cognito${sharedId}`,
  authSelections: 'identityPoolAndUserPool',
  ...roles,
});

const userPoolDefaults = projectName => ({
  userPoolName: `${projectName}_userpool_${sharedId}`,
  autoVerifiedAttributes: ['email'],
  mfaConfiguration: 'OFF',
  mfaTypes: ['SMS Text Message'],
  roleName: `${projectName}_sns-role`,
  roleExternalId: `${projectName}_role_external_id`,
  policyName: `${projectName}-sns-policy`,
  smsAuthenticationMessage: 'Your authentication code is {####}',
  smsVerificationMessage: 'Your verification code is {####}',
  emailVerificationSubject: 'Your verification code',
  emailVerificationMessage: 'Your verification code is {####}',
  defaultPasswordPolicy: booleanOptions.find(b => b.value === false).value,
  passwordPolicyMinLength: 8,
  passwordPolicyCharacters: [
    'Requires Lowercase',
    'Requires Uppercase',
    'Requires Numbers',
    'Requires Symbols',
  ],
  requiredAttributes: [
    coreAttributes.find(b => b.name === 'Email').value,
  ],
  userpoolClientName: `${projectName}_app_client`,
  userpoolClientGenerateSecret: true,
  userpoolClientRefreshTokenValidity: 30,
  userpoolClientReadAttributes: [
    appClientReadAttributes.find(d => d.name === 'Email').value,
  ],
  mfaLambdaRole: `${projectName}_totp_lambda_role`,
  mfaLambdaLogPolicy: `${projectName}_totp_lambda_log_policy`,
  mfaPassRolePolicy: `${projectName}_totp_pass_role_policy`,
  mfaLambdaIAMPolicy: `${projectName}_totp_lambda_iam_policy`,
  userpoolClientLambdaRole: `${projectName}_userpoolclient_lambda_role`,
  userpoolClientLogPolicy: `${projectName}_userpoolclient_lambda_log_policy`,
  userpoolClientLambdaPolicy: `${projectName}_userpoolclient_lambda_iam_policy`,
  userpoolClientSetAttributes: false,
});

const identityPoolDefaults = projectName => ({
  identityPoolName: `${projectName}_identitypool_${sharedId}`,
  allowUnauthenticatedIdentities: booleanOptions.find(b => b.value === false).value,
  thirdPartyAuth: booleanOptions.find(b => b.value === false).value,
  lambdaLogPolicy: `${projectName}_lambda_log_policy`,
  openIdLambdaRoleName: `${projectName}_openid_lambda_role`,
  openIdRolePolicy: `${projectName}_openid_pass_role_policy`,
  openIdLambdaIAMPolicy: `${projectName}_openid_lambda_iam_policy`,
  openIdLogPolicy: `${projectName}_openid_lambda_log_policy`,

});

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
  ];

  return Object.assign(target, ...sources);
};

module.exports = {
  getAllDefaults,
  functionMap,
  generalDefaults,
  entityKeys,
  roles,
};
