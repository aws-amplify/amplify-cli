const uuid = require('uuid');
const { authFlowMap, coreAttributes, appClientReadAttributes } = require('./string-maps');

const [sharedId] = uuid().split('-');

const general = () => ({
  resourceName: `cognito${sharedId}`,
  authSelections: [
    'Cognito Identity Pool Only',
  ],
});

const userPoolDefaults = () => ({
  userPoolName: `<label>-userpool-${sharedId}`,
  mfaConfiguration: 'ON',
  mfaTypes: ['SMS Text Message'],
  roleName: `<label>-sns-role-${sharedId}`,
  roleExternalId: sharedId,
  policyName: `<label>-sns-policy-${sharedId}`,
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
  userpoolClientName: `<label>-app-client-${sharedId}`,
  userpoolClientAuthFlow: [authFlowMap.find(c => c.value === 'ADMIN_NO_SRP_AUTH').value],
  userpoolClientGenerateSecret: true,
  userpoolClientRefreshTokenValidity: 30,
  userpoolClientReadAttributes: [
    appClientReadAttributes.find(d => d.name === 'Email').value,
    appClientReadAttributes.find(e => e.name === 'Phone Number').value,
  ],
  identityPoolName: `<label>_identitypool_${sharedId.replace(/-/g, '_')}`,
  allowUnauthenticatedIdentities: false,
  totpLambdaRole: `<label>_totp_lambda_role_${sharedId}`,
  totpLambdaLogPolicy: `<label>_totp_lambda_log_policy_${sharedId}`,
  totpPassRolePolicy: `<label>_totp_pass_role_policy_${sharedId}`,
  totpLambdaIAMPolicy: `<label>_totp_lambda_iam_policy_${sharedId}`,
  ...identityPoolDefaults(),
});

const identityPoolDefaults = () => ({
  // replace dashes with underscores for id pool regex constraint
  identityPoolName: `<label>_identitypool_${sharedId.replace(/-/g, '_')}`,
  allowUnauthenticatedIdentities: false,
  lambdaLogPolicy: `<label>_lambda_log_policy_${sharedId}`,
  federatedIDLambdaRole: `<label>_federated_lambda_role_${sharedId}`,
  federatedLambdaIAMPolicy: `<label>_federated_lambda_iam_policy_${sharedId}`,
});

const functionMap = {
  identityPoolOnly: identityPoolDefaults,
  identityPoolAndUserPool: userPoolDefaults,
};

const getAllDefaults = () => {
  const target = general();
  const sources = [
    userPoolDefaults(),
    identityPoolDefaults(),
  ];

  return Object.assign(target, ...sources);
};

module.exports = {
  general,
  userPoolDefaults,
  identityPoolDefaults,
  getAllDefaults,
  functionMap,
};
