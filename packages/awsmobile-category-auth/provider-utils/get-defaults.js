const uuid = require('uuid');

const general = () => ({
  resourceName: `cognito${uuid().replace(/-/g, '')}`,
  authSelections: [
    'Cognito Identity Pools',
  ],
});

const userPoolDefaults = () => ({
  userPoolName: `<name>-userpool-${uuid()}`,
  mfaConfiguration: 'ON',
  roleName: `<name>-sns-role-${uuid()}`,
  roleExternalId: uuid(),
  policyName: `<name>-sns-policy-${uuid()}`,
  smsAuthenticationMessage: 'Your authentication code is {####}',
  smsVerificationMessage: 'Your verification code is {####}',
});

const identityPoolDefaults = () => ({
  // replace dashes with underscores for id pool regex constraint
  identityPoolName: `<name>_identitypool_${uuid().replace(/-/g, '_')}`,
  allowUnauthenticatedIdentities: false,
});

const functionMap = {
  'Cognito Identity Pools': userPoolDefaults,
  'Cognito User Pools': identityPoolDefaults,
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
