const uuid = require('uuid');
const { authFlowMap, coreAttributes, appClientReadAttributes } = require('./string-maps');

const [sharedId] = uuid().split('-');

const general = () => ({
  resourceName: `cognito${sharedId}`,
  authSelections: [
    'Cognito Identity Pool Only',
  ],
});

const userPoolDefaults = name => ({
  userPoolName: `${name}-userpool-${sharedId}`,
  mfaConfiguration: 'ON',
  mfaTypes: ['SMS Text Message'],
  roleName: `${name}-sns-role-${sharedId}`,
  roleExternalId: sharedId,
  policyName: `${name}-sns-policy-${sharedId}`,
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
    coreAttributes.find(a => a.name === 'Email').value,
    coreAttributes.find(b => b.name === 'Phone Number').value,
  ],
  userpoolClientName: `${name}-app-client-${sharedId}`,
  userpoolClientAuthFlow: [authFlowMap.find(c => c.value === 'ADMIN_NO_SRP_AUTH').value],
  userpoolClientGenerateSecret: true,
  userpoolClientRefreshTokenValidity: 30,
  userpoolClientReadAttributes: [
    appClientReadAttributes.find(d => d.name === 'Email').value,
    appClientReadAttributes.find(e => e.name === 'Phone Number').value,
  ],
  identityPoolName: `${name}_identitypool_${sharedId.replace(/-/g, '_')}`,
  allowUnauthenticatedIdentities: false,
  totpLambdaRole: `${name}_totp_lambda_role_${sharedId}`,
  totpLambdaLogPolicy: `${name}_totp_lambda_log_policy_${sharedId}`,
  totpPassRolePolicy: `${name}_totp_pass_role_policy_${sharedId}`,
  totpLambdaIAMPolicy: `${name}_totp_lambda_iam_policy_${sharedId}`,
  userpoolClientLambdaRole: `${name}_userpool_client_lambda_role_${sharedId}`,
  userpoolClientLogPolicy: `${name}_userpoolclient_lambda_log_policy_${sharedId}`,
  userpoolClientLambdaIamPolicy: `${name}_userpoolclient_lambda_iam_policy_${sharedId}`,
  ...identityPoolDefaults(),
});

const identityPoolDefaults = name => ({
  // replace dashes with underscores for id pool regex constraint
  identityPoolName: `${name}_identitypool_${sharedId.replace(/-/g, '_')}`,
  allowUnauthenticatedIdentities: false,
  lambdaLogPolicy: `${name}_lambda_log_policy_${sharedId}`,
  federatedIDLambdaRole: `${name}_federated_lambda_role_${sharedId}`,
  federatedLambdaIAMPolicy: `${name}_federated_lambda_iam_policy_${sharedId}`,
});

const functionMap = {
  identityPoolOnly: identityPoolDefaults,
  identityPoolAndUserPool: userPoolDefaults,
};

const getAllDefaults = (amplify) => {
  const projectName = amplify.projectConfig.projectName.toLowerCase();
  const target = general();
  const sources = [
    userPoolDefaults(projectName),
    identityPoolDefaults(projectName),
  ];

  return Object.assign(target, ...sources);
};

module.exports = {
  getAllDefaults,
  functionMap,
};
