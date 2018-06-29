const uuid = require('uuid');

const [shortId] = uuid().split('-');

const general = () => ({
  resourceName: `cognito${shortId}`,
  authSelections: [
    'Cognito Identity Pools',
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
  passwordPolicy: {
    minLength: 8,
    requiresLower: true,
    requiresUpper: true,
    requiresNumbers: true,
    requiresSymbols: true
  },
  requiredAttributes: [
    'email',
    'phone_number'
  ],
});

const userPoolClientDefaults = () => ({
  name: `<label>-app-client-${uuid()}`,
  authFlow: 'ADMIN_NO_SRP_AUTH',
  generateSecret: true,
  refreshTokenValidity: 30
});

const identityPoolDefaults = () => ({
  // replace dashes with underscores for id pool regex constraint
  identityPoolName: `<label>_identitypool_${uuid().replace(/-/g, '_')}`,
  allowUnauthenticatedIdentities: false,
});

const functionMap = {
  'Cognito Identity Pools': userPoolDefaults,
  'Cognito User Pools': identityPoolDefaults,
  'Cognito Identity Pool Clients': userPoolClientDefaults
};

const getAllDefaults = () => {
  const target = general();
  const sources = [
    userPoolDefaults(),
    identityPoolDefaults(),
    userPoolClientDefaults()
  ];

  return Object.assign(target, ...sources);
};

module.exports = {
  general,
  userPoolDefaults,
  identityPoolDefaults,
  userPoolClientDefaults,
  getAllDefaults,
  functionMap,
};
