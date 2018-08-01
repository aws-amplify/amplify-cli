const uuid = require('uuid');
const { coreAttributes, appClientReadAttributes } = require('./string-maps');

const [sharedId] = uuid().split('-');

const generalDefaults = () => ({
  resourceName: `cognito${sharedId}`,
  authSelections: ['identityPoolAndUserPool'],
});

const userPoolDefaults = projectName => ({
  userPoolName: `${projectName}-userpool-${sharedId}`,
  autoVerifiedAttributes: ['phone_number'],
  mfaConfiguration: 'OFF',
  mfaTypes: ['SMS Text Message'],
  roleName: `${projectName}-sns-role-${sharedId}`,
  roleExternalId: sharedId,
  policyName: `${projectName}-sns-policy-${sharedId}`,
  smsAuthenticationMessage: 'Your authentication code is {####}',
  smsVerificationMessage: 'Your verification code is {####}',
  emailVerificationSubject: 'Your verification code',
  emailVerificationMessage: 'Your verification code is {####}',
  passwordPolicyMinLength: 8,
  passwordPolicyCharacters: [
    'Requires Lowercase',
    'Requires Uppercase',
    'Requires Numbers',
    'Requires Symbols',
  ],
  requiredAttributes: [
    coreAttributes.find(b => b.name === 'Phone Number').value,
  ],
  userpoolClientName: `${projectName}-app-client-${sharedId}`,
  userpoolClientGenerateSecret: true,
  userpoolClientRefreshTokenValidity: 30,
  userpoolClientReadAttributes: [
    appClientReadAttributes.find(d => d.name === 'Email').value,
    appClientReadAttributes.find(e => e.name === 'Phone Number').value,
  ],
  allowUnauthenticatedIdentities: false,
  mfaLambdaRole: `${projectName}_totp_lambda_role_${sharedId}`,
  mfaLambdaLogPolicy: `${projectName}_totp_lambda_log_policy_${sharedId}`,
  mfaPassRolePolicy: `${projectName}_totp_pass_role_policy_${sharedId}`,
  mfaLambdaIAMPolicy: `${projectName}_totp_lambda_iam_policy_${sharedId}`,
  userpoolClientLambdaRole: `${projectName}_userpool_client_lambda_role_${sharedId}`,
  userpoolClientLogPolicy: `${projectName}_userpoolclient_lambda_log_policy_${sharedId}`,
  userpoolClientLambdaPolicy: `${projectName}_userpoolclient_lambda_iam_policy_${sharedId}`,
});

const identityAndUserPoolDefaults = projectName => ({
  // replace dashes with underscores for id pool regex constraint
  identityPoolName: `${projectName}_identitypool_${sharedId.replace(/-/g, '_')}`,
  allowUnauthenticatedIdentities: false,
  lambdaLogPolicy: `${projectName}_lambda_log_policy_${sharedId}`,
  ...userPoolDefaults(projectName),
});

const functionMap = {
  userPoolOnly: userPoolDefaults,
  identityPoolAndUserPool: identityAndUserPoolDefaults,
};

const getAllDefaults = (amplify) => {
  const projectName = amplify.projectConfig.projectName.toLowerCase();
  const target = generalDefaults();
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
};
