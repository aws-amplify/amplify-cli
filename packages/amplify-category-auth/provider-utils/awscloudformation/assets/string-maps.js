const messages = {
  authExists: 'Auth has already been added to this project. To update run amplify update auth.',
  dependenciesExists: '\nYou have configured resources that might depend on this Cognito resource.  Updating this Cognito resource could have unintended side effects.\n',
};

const learnMoreOption = [{
  name: 'I want to learn more.',
  value: 'learnMore',
}];

const defaultPrompMap = [
  {
    name: 'Yes, use the default configuration.',
    value: 'default',
  },
  {
    name: 'No, I will set up my own configuration.',
    value: 'manual',
  },
  ...learnMoreOption,
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
];

const disableOptionsOnEdit = () => {
  mfaOptions.find(i => i.value === 'ON').disabled = true;
};

const getAllMaps = ((edit) => {
  if (edit) {
    disableOptionsOnEdit();
  }
  return {
    coreAttributes,
    authSelectionMap,
    appClientReadAttributes,
    authProviders,
    mfaOptions,
    mfaMethods,
    emailRegistration,
    defaultPrompMap,
    booleanOptions,
  };
});

module.exports = {
  coreAttributes,
  appClientReadAttributes,
  authSelectionMap,
  getAllMaps,
  authProviders,
  mfaOptions,
  mfaMethods,
  emailRegistration,
  defaultPrompMap,
  booleanOptions,
  messages,
};
