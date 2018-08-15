const uuid = require('uuid');
const { coreAttributes, appClientReadAttributes, booleanOptions } = require('./string-maps');

const [sharedId] = uuid().split('-');

const generalDefaults = () => ({
  resourceName: `cognito${sharedId}`,
  authSelections: 'identityPoolAndUserPool',
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
  defaultPasswordPolicy: booleanOptions.find(b => b.value === false),
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
  const projectName = name.projectConfig ? `${name.projectConfig.projectName.toLowerCase()}${sharedId}` : name;
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
};
