const authFlowMap = [
  {
    name: 'Enable sign-in API for server-based authentication',
    value: 'ADMIN_NO_SRP_AUTH',
  }, {
    name: 'Only allow Custom Authentication',
    value: 'CUSTOM_AUTH_FLOW_ONLY',
  }, {
    name: 'Enable username-password (non-SRP) flow for app-based authentication',
    value: 'USER_PASSWORD_AUTH',
  },
];


const mfaOptions = [
  {
    name: 'OFF',
    value: 'OFF',
  },
  {
    name: 'ON (Required for all logins, can not be enabled later)',
    value: 'ON',
  },
  {
    name: 'OPTIONAL (Individual users can use MFA)',
    value: 'OPTIONAL',
  },
];

const mfaMethods = [
  {
    name: 'SMS Text Message',
    value: 'SMS Text Message',
  },
  {
    name: 'Time-Based One-Time Password (TOTP)',
    value: 'TOTP',
  },
];

const emailRegistration = [ 
  {
    name: 'Enabled (Requires per-user email entry at registration)',
    value: ['email', 'phone_number'],
  },
  {
    name: 'Disabled (Uses SMS/TOTP as an alternative)',
    value: ['phone_number'],
  },
];

const authSelections = [
  {
    name: 'User Sign-Up, Sign-In, connected with AWS IAM controls (Enables per-user Storage features for images or other content, Analytics, and more)',
    value: 'identityPoolAndUserPool',
  }, {
    name: 'User Sign-Up & Sign-In only (Best used with a cloud API only)',
    value: 'identityPoolOnly',
  },
];

const coreAttributes = [
  {
    name: 'Address',
    value: 'address',
  }, {
    name: 'Birthdate',
    value: 'birthdate',
  }, {
    name: 'Email',
    value: 'email',
  }, {
    name: 'Family Name',
    value: 'family_name',
  }, {
    name: 'Given Name',
    value: 'given_name',
  }, {
    name: 'Locale',
    value: 'locale',
  }, {
    name: 'Middle Name',
    value: 'middle_name',
  },
  {
    name: 'Name',
    value: 'name',
  }, {
    name: 'Nickname',
    value: 'nickname',
  }, {
    name: 'Phone Number',
    value: 'phone_number',
  }, {
    name: 'Preferred Username',
    value: 'preferred_username',
  }, {
    name: 'Picture',
    value: 'picture',
  }, {
    name: 'Profile',
    value: 'profile',
  }, {
    name: 'Updated At',
    value: 'updated_at',
  }, {
    name: 'Website',
    value: 'website',
  }, {
    name: 'Zone Info',
    value: 'zoneinfo',
  },
];

const appClientReadAttributes = [
  ...coreAttributes,
  {
    name: 'Email Verified?',
    value: 'email_verified',
  }, {
    name: 'Phone Number Verified?',
    value: 'phone_number_verified',
  },
];

const authProviders = [
  {
    name: 'Facebook',
    value: 'graph.facebook.com',
    answerHashKey: 'facebookAppId',
  },
  {
    name: 'Google',
    value: 'accounts.google.com',
    answerHashKey: 'googleClientId',
  },
  {
    name: 'Amazon',
    value: 'www.amazon.com',
    answerHashKey: 'amazonAppId',
  },
  {
    name: 'Twitter',
    value: 'api.twitter.com',
    answerHashKey: 'twitterConsumerKey',
    concatKeys: ['twitterConsumerSecret'],
  },
];

const getAllMaps = (() => ({
  authFlowMap,
  coreAttributes,
  authSelections,
  appClientReadAttributes,
  authProviders,
  mfaOptions,
  mfaMethods,
  emailRegistration,
}));

module.exports = {
  authFlowMap,
  coreAttributes,
  appClientReadAttributes,
  authSelections,
  getAllMaps,
  authProviders,
  mfaOptions,
  mfaMethods,
  emailRegistration,
};
