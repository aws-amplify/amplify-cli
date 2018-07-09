const uuid = require('uuid');
const { authFlowMap, coreAttributes, appClientReadAttributes } = require('./string-maps');

const [shortId] = uuid().split('-');

const general = () => ({
  resourceName: `cognito${shortId}`,
  authSelections: [
    'Cognito Identity Pool Only',
  ],
});

const userPoolDefaults = () => ({
  userPoolName: `<label>-userpool-${uuid()}`,
  mfaConfiguration: 'ON',
  roleName: `<label>-sns-role-${uuid()}`,
  roleExternalId: uuid(),
  policyName: `<label>-sns-policy-${uuid()}`,
  smsAuthenticationMessage: 'Your authentication code is {####}',
  smsVerificationMessage: 'Your verification code is {####}',
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
  userpoolClientName: `<label>-app-client-${uuid()}`,
  userpoolClientAuthFlow: [authFlowMap.find(c => c.value === 'ADMIN_NO_SRP_AUTH').value],
  userpoolClientGenerateSecret: true,
  userpoolClientRefreshTokenValidity: 30,
  userpoolClientReadAttributes: [
    appClientReadAttributes.find(d => d.name === 'Email').value,
    appClientReadAttributes.find(e => e.name === 'Phone Number').value,
  ],
  identityPoolName: `<label>_identitypool_${uuid().replace(/-/g, '_')}`,
  allowUnauthenticatedIdentities: false,
  ...identityPoolDefaults(),
});

const identityPoolDefaults = () => ({
  // replace dashes with underscores for id pool regex constraint
  identityPoolName: `<label>_identitypool_${uuid().replace(/-/g, '_')}`,
  allowUnauthenticatedIdentities: false,
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
