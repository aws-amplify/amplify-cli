const messages = {
  authExists: 'Auth has already been added to this project. To update run amplify update auth.',
  dependenciesExists:
    '\nYou have configured resources that might depend on this Cognito resource.  Updating this Cognito resource could have unintended side effects.\n',
};

const learnMoreOption = [
  {
    name: 'I want to learn more.',
    value: 'learnMore',
  },
];

const defaultPromptMap = [
  {
    name: 'Default configuration',
    value: 'default',
  },
  {
    name: 'Default configuration with Social Provider (Federation)',
    value: 'defaultSocial',
  },
  {
    name: 'Manual configuration',
    value: 'manual',
  },
  ...learnMoreOption,
];

const updateFlowMap = [
  {
    name: 'Apply default configuration without Social Provider (Federation)',
    value: 'default',
    conditionKey: 'useDefault',
  },
  {
    name: 'Apply default configuration with Social Provider (Federation)',
    value: 'defaultSocial',
    conditionKey: 'useDefault',
  },
  {
    name: 'Walkthrough all the auth configurations',
    value: 'manual',
  },
  {
    name: 'Add/Edit signin and signout redirect URIs',
    value: 'callbacks',
    conditionKey: 'CallbackURLs',
    conditionMsg: 'You have not initially configured OAuth.',
  },
  {
    name: 'Update OAuth social providers',
    value: 'providers',
    conditionKey: 'hostedUIProviderCreds',
    conditionMsg: 'You have not initially configured OAuth.',
  },
  {
    name: 'Create or update Cognito user pool groups',
    value: 'updateUserPoolGroups',
  },
  {
    name: 'Create or update Admin queries API',
    value: 'updateAdminQueries',
  },
];

const booleanOptions = [
  {
    name: 'Yes',
    value: true,
  },
  {
    name: 'No',
    value: false,
  },
  ...learnMoreOption,
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
  ...learnMoreOption,
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
    value: ['email'],
  },
  {
    name: 'Disabled (Uses SMS/TOTP as an alternative)',
    value: ['phone_number'],
  },
];

const authSelectionMap = [
  {
    name: 'User Sign-Up, Sign-In, connected with AWS IAM controls (Enables per-user Storage features for images or other content, Analytics, and more)',
    value: 'identityPoolAndUserPool',
  },
  {
    name: 'User Sign-Up & Sign-In only (Best used with a cloud API only)',
    value: 'userPoolOnly',
  },
  // {
  //   name: 'Identity Pool Only',
  //   value: 'identityPoolOnly',
  // },
  ...learnMoreOption,
];

const attributeProviderMap = {
  address: {
    facebook: {},
    google: {},
    loginwithamazon: {},
    signinwithapple: {},
  },
  birthdate: {
    facebook: {
      attr: 'birthday',
      scope: 'public_profile',
    },
    google: {
      attr: 'birthdays',
      scope: 'profile',
    },
    loginwithamazon: {},
    signinwithapple: {},
  },
  email: {
    facebook: {
      attr: 'email',
      scope: 'email',
    },
    google: {
      attr: 'email',
      scope: 'email',
    },
    loginwithamazon: {
      attr: 'email',
      scope: 'profile',
    },
    signinwithapple: {
      attr: 'email',
      scope: 'email',
    },
  },
  family_name: {
    facebook: {
      attr: 'last_name',
      scope: 'public_profile',
    },
    google: {
      attr: 'family_name',
      scope: 'profile',
    },
    loginwithamazon: {},
    signinwithapple: {
      attr: 'lastName',
      scope: 'name',
    },
  },
  gender: {
    facebook: {
      attr: 'gender',
      scope: 'public_profile',
    },
    google: {
      attr: 'genders',
      scope: 'profile',
    },
    loginwithamazon: {},
    signinwithapple: {},
  },
  given_name: {
    facebook: {
      attr: 'first_name',
      scope: 'public_profile',
    },
    google: {
      attr: 'given_name',
      scope: 'profile',
    },
    loginwithamazon: {},
    signinwithapple: {
      attr: 'firstName',
      scope: 'name',
    },
  },
  locale: {
    facebook: {},
    google: {},
    loginwithamazon: {
      attr: 'postal_code',
      scope: 'postal_code',
    },
    signinwithapple: {},
  },
  middle_name: {
    facebook: {
      attr: 'middle_name',
      scope: 'public_profile',
    },
    google: {},
    loginwithamazon: {},
    signinwithapple: {},
  },
  name: {
    facebook: {
      attr: 'name',
      scope: 'public_profile',
    },
    google: {
      attr: 'name',
      scope: 'profile',
    },
    loginwithamazon: {
      attr: 'name',
      scope: 'profile',
    },
    signinwithapple: {},
  },
  nickname: {
    facebook: {},
    google: {},
    loginwithamazon: {},
    signinwithapple: {},
  },
  phone_number: {
    facebook: {},
    google: {
      attr: 'phoneNumbers',
      scope: 'profile',
    },
    loginwithamazon: {},
    signinwithapple: {},
  },
  picture: {
    facebook: {
      attr: 'picture',
      scope: 'public_profile',
    },
    google: {
      attr: 'picture',
      scope: 'profile',
    },
    loginwithamazon: {},
    signinwithapple: {},
  },
  preferred_username: {
    facebook: {},
    google: {},
    loginwithamazon: {},
    signinwithapple: {},
  },
  profile: {
    facebook: {},
    google: {},
    loginwithamazon: {},
    signinwithapple: {},
  },
  zoneinfo: {
    facebook: {},
    google: {},
    loginwithamazon: {},
    signinwithapple: {},
  },
  website: {
    facebook: {},
    google: {},
    loginwithamazon: {},
    signinwithapple: {},
  },
  username: {
    facebook: {
      attr: 'id',
      scope: 'public_profile',
    },
    google: {
      attr: 'sub',
      scope: 'profile',
    },
    loginwithamazon: {
      attr: 'user_id',
      scope: 'profile:user_id',
    },
    signinwithapple: {},
  },
  updated_at: {
    facebook: {
      attr: 'updated_at',
      scope: 'public_profile',
    },
    google: {},
    loginwithamazon: {},
    signinwithapple: {},
  },
};

const coreAttributes = [
  {
    name: 'Address',
    value: 'address',
  },
  {
    name: 'Birthdate',
    value: 'birthdate',
  },
  {
    name: 'Email',
    value: 'email',
  },
  {
    name: 'Family Name',
    value: 'family_name',
  },
  {
    name: 'Middle Name',
    value: 'middle_name',
  },
  {
    name: 'Gender',
    value: 'gender',
  },
  {
    name: 'Locale',
    value: 'locale',
  },
  {
    name: 'Given Name',
    value: 'given_name',
  },
  {
    name: 'Name',
    value: 'name',
  },
  {
    name: 'Nickname',
    value: 'nickname',
  },
  {
    name: 'Phone Number',
    value: 'phone_number',
  },
  {
    name: 'Preferred Username',
    value: 'preferred_username',
  },
  {
    name: 'Picture',
    value: 'picture',
  },
  {
    name: 'Profile',
    value: 'profile',
  },
  {
    name: 'Updated At',
    value: 'updated_at',
  },
  {
    name: 'Website',
    value: 'website',
  },
  {
    name: 'Zone Info',
    value: 'zoneinfo',
  },
];

const aliasAttributes = [
  {
    name: 'Email',
    value: 'email',
    checked: true,
  },
  {
    name: 'Username',
    value: 'preferred_username',
  },
  {
    name: 'Phone number',
    value: 'phone_number',
  },
];

const appClientReadAttributes = [
  ...coreAttributes,
  {
    name: 'Email Verified?',
    value: 'email_verified',
  },
  {
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
    name: 'Apple',
    value: 'appleid.apple.com',
    answerHashKey: 'appleAppId',
  },
];

const hostedUIProviders = [
  {
    name: 'Facebook',
    value: 'Facebook',
    key: 'FACEBOOK',
  },
  {
    name: 'Google',
    value: 'Google',
    key: 'GOOGLE',
  },
  {
    name: 'Login With Amazon',
    value: 'LoginWithAmazon',
    key: 'AMAZON',
  },
  {
    name: 'Sign in with Apple',
    value: 'SignInWithApple',
    key: 'APPLE',
  },
];

const authorizeScopes = [
  {
    name: 'Email',
    value: 'email',
  },
  {
    name: 'Public Profile',
    value: 'public_profile',
  },
];

const signInOptions = [
  {
    name: 'Username',
    value: 'username',
  },
  {
    name: 'Email',
    value: 'email',
  },
  {
    name: 'Phone Number',
    value: 'phone_number',
  },
  {
    name: 'Email or Phone Number',
    value: 'email, phone_number',
  },
  ...learnMoreOption,
];

const socialLoginOptions = [
  {
    name: 'Identity Pool',
    value: 'identityPool',
  },
  {
    name: 'User Pool',
    value: 'userPool',
  },
  {
    name: 'Neither',
    value: null,
  },
];

const oAuthFlows = [
  {
    name: 'Authorization code grant',
    value: 'code',
  },
  {
    name: 'Implicit grant',
    value: 'implicit',
  },
];

const oAuthScopes = [
  {
    name: 'Phone',
    value: 'phone',
  },
  {
    name: 'Email',
    value: 'email',
  },
  {
    name: 'OpenID',
    value: 'openid',
  },
  {
    name: 'Profile',
    value: 'profile',
  },
  {
    name: 'aws.cognito.signin.user.admin',
    value: 'aws.cognito.signin.user.admin',
  },
];

const capabilities = [
  {
    name: 'Add Google reCaptcha Challenge',
    value: 'mfaWithCaptcha',
    triggers: {
      DefineAuthChallenge: ['captcha-define-challenge'],
      CreateAuthChallenge: ['captcha-create-challenge'],
      VerifyAuthChallengeResponse: ['captcha-verify'],
    },
  },
  {
    name: 'Email Verification Link with Redirect',
    value: 'confirmationRedirect',
    triggers: {
      CustomMessage: ['verification-link'],
    },
  },
  {
    name: 'Add User to Group',
    value: 'addUserToGroup',
    triggers: {
      PostConfirmation: ['add-to-group'],
    },
  },
  {
    name: 'Email Domain Filtering (denylist)',
    value: 'emailDenylist',
    triggers: {
      PreSignup: ['email-filter-denylist'],
    },
  },
  {
    name: 'Email Domain Filtering (allowlist)',
    value: 'emailAllowlist',
    triggers: {
      PreSignup: ['email-filter-allowlist'],
    },
  },
  {
    name: 'Custom Auth Challenge Flow (basic scaffolding - not for production)',
    value: 'customAuthScaffolding',
    triggers: {
      DefineAuthChallenge: ['boilerplate-define-challenge'],
      CreateAuthChallenge: ['boilerplate-create-challenge'],
      VerifyAuthChallengeResponse: ['boilerplate-verify'],
    },
  },
  {
    name: 'Override ID Token Claims',
    value: 'alter-claims',
    triggers: {
      PreTokenGeneration: ['alter-claims'],
    },
  },
];

const additonalConfigMap = [
  {
    name: 'No, I am done.',
    value: [],
  },
  {
    name: 'Yes, I want to make some additional changes.',
    value: ['requiredAttributes', 'triggers'],
  },
];

const disableOptionsOnEdit = () => {
  mfaOptions.find(i => i.value === 'ON').disabled = true;
};

const getAllMaps = edit => {
  if (edit) {
    disableOptionsOnEdit();
  }
  return {
    aliasAttributes,
    coreAttributes,
    authSelectionMap,
    appClientReadAttributes,
    authProviders,
    mfaOptions,
    mfaMethods,
    emailRegistration,
    defaultPromptMap,
    booleanOptions,
    signInOptions,
    socialLoginOptions,
    hostedUIProviders,
    oAuthFlows,
    oAuthScopes,
    authorizeScopes,
    attributeProviderMap,
    updateFlowMap,
    capabilities,
    additonalConfigMap,
  };
};

module.exports = {
  aliasAttributes,
  coreAttributes,
  appClientReadAttributes,
  authSelectionMap,
  getAllMaps,
  authProviders,
  mfaOptions,
  mfaMethods,
  emailRegistration,
  defaultPromptMap,
  booleanOptions,
  signInOptions,
  socialLoginOptions,
  hostedUIProviders,
  authorizeScopes,
  oAuthFlows,
  oAuthScopes,
  messages,
  attributeProviderMap,
  updateFlowMap,
  capabilities,
  additonalConfigMap,
};
