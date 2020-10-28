export const supportedServices = {
  Cognito: {
    inputs: [
      {
        key: 'useDefault',
        prefix: '\n The current configured provider is Amazon Cognito. \n',
        question: 'Do you want to use the default authentication and security configuration?',
        type: 'list',
        default: true,
        learnMore:
          "This utility allows you to set up Amazon Cognito User Pools and Identity Pools for your application.\nAmazon Cognito User Pool makes it easy for developers to add sign-up and sign-in functionality to web and mobile applications. It serves as your own identity provider to maintain a user directory. It supports user registration and sign-in, as well as provisioning identity tokens for signed-in users.\nAmazon Cognito identity pools provide temporary AWS credentials for users who are guests (unauthenticated) and for users who have been authenticated and received a token. An identity pool is a store of user identity data specific to your account.\nIf you choose to use the default configuration, this utility will set up both a Userpool and an Identity Pool.\nIf you choose the 'Default configuration with Social Provider (Federation)', the providers will be federated with Cognito User Pools.\nIn either case, User Pools will be federated with Identity Pools allowing any users logging in to get both identity tokens as well as AWS Credentials.",
        map: 'defaultPromptMap',
        andConditions: [
          {
            preventEdit: 'always',
          },
        ],
      },
      {
        key: 'updateFlow',
        question: 'What do you want to do?',
        type: 'list',
        default: true,
        filter: 'updateOptions',
        learnMore:
          'This utility allows you to set up Amazon Cognito User Pools and Identity Pools for your application.\nAmazon Cognito User Pool makes it easy for developers to add sign-up and sign-in functionality to web and mobile applications. It serves as your own identity provider to maintain a user directory. It supports user registration and sign-in, as well as provisioning identity tokens for signed-in users.\nAmazon Cognito identity pools provide temporary AWS credentials for users who are guests (unauthenticated) and for users who have been authenticated and received a token. An identity pool is a store of user identity data specific to your account.\nIf you choose to use the default configuration, this utility will set up both a Userpool and an Identity Pool.',
        map: 'updateFlowMap',
        andConditions: [
          {
            onCreate: 'never',
          },
        ],
      },
      {
        key: 'authSelections',
        question: 'Select the authentication/authorization services that you want to use:',
        required: true,
        type: 'list',
        map: 'authSelectionMap',
        learnMore:
          'Amazon Cognito identity pools provide temporary AWS credentials for users who are guests (unauthenticated) and for users who have been authenticated and received a token. An identity pool is a store of user identity data specific to your account.\nIf you choose to use the default configuration, this utility will set up both a Userpool and an Identity Pool.',
        andConditions: [
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
      },
      {
        key: 'resourceName',
        question: 'Please provide a friendly name for your resource that will be used to label this category in the project:',
        andConditions: [
          {
            preventEdit: 'always',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
        validation: {
          operator: 'regex',
          value: '^([a-zA-Z0-9]){1,128}$',
          onErrorMsg: 'The resource name must be at least 1 character and no more than 128 and only contain alphanumeric characters.',
        },
        required: true,
      },
      {
        key: 'identityPoolName',
        question: 'Please enter a name for your identity pool.',
        required: true,
        learnMore:
          'Amazon Cognito identity pools provide temporary AWS credentials for users who are guests (unauthenticated) and for users who have been authenticated and received a token. An identity pool is a store of user identity data specific to your account.\nThe name of the identity pool should be between 1 and 128 characters.',
        validation: {
          operator: 'regex',
          value: '^([a-zA-Z0-9_]){1,128}$',
          onErrorMsg: 'The identity pool name must be at least 1 character and no more than 128.',
        },
        andConditions: [
          {
            key: 'authSelections',
            value: 'userPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            preventEdit: 'exists',
            key: 'identityPoolName',
          },
        ],
      },
      {
        key: 'allowUnauthenticatedIdentities',
        question: 'Allow unauthenticated logins? (Provides scoped down permissions that you can control via AWS IAM)',
        type: 'list',
        map: 'booleanOptions',
        learnMore: "If you select 'yes', your identity pool will provide temporary AWS credentials for unauthenticated guest users.",
        required: true,
        andConditions: [
          {
            key: 'authSelections',
            value: 'userPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
      },
      {
        key: 'thirdPartyAuth',
        question: 'Do you want to enable 3rd party authentication providers in your identity pool?',
        learnMore:
          'If you select yes, your identity pool will support users who are authenticated via a public login provider such as Facebook, Google, and Amazon (non-Cognito).  Your identity pool will continue to support users who are authenticated via a user pool.',
        temp: true,
        type: 'list',
        map: 'booleanOptions',
        required: true,
        andConditions: [
          {
            key: 'authSelections',
            value: 'userPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
      },
      {
        key: 'authProviders',
        question: 'Select the third party identity providers you want to configure for your identity pool:',
        temp: true,
        type: 'multiselect',
        map: 'authProviders',
        required: true,
        andConditions: [
          {
            key: 'authSelections',
            value: 'userPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'thirdPartyAuth',
            value: true,
            operator: '=',
          },
        ],
      },
      {
        key: 'facebookAppId',
        prefix:
          " \n You've opted to allow users to authenticate via Facebook.  If you haven't already, you'll need to go to https://developers.facebook.com and create an App ID. \n",
        question: 'Enter your Facebook App ID for your identity pool: ',
        required: true,
        andConditions: [
          {
            key: 'authProviders',
            value: 'graph.facebook.com',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'googleClientId',
        prefix:
          " \n You've opted to allow users to authenticate via Google.  If you haven't already, you'll need to go to https://developers.google.com/identity and create an App ID. \n",
        question: 'Enter your Google Web Client ID for your identity pool: ',
        required: true,
        andConditions: [
          {
            key: 'authProviders',
            value: 'accounts.google.com',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'googleIos',
        prefix:
          " \n You've opted to allow users to authenticate via Google within an iOS project.  If you haven't already, you'll need to go to https://developers.google.com/identity and create an iOS Client ID. \n",
        question: 'Enter your Google iOS Client ID for your identity pool: ',
        required: true,
        andConditions: [
          {
            key: 'authProviders',
            value: 'accounts.google.com',
            operator: 'includes',
          },
          {
            key: 'frontend',
            value: 'ios',
            operator: 'configMatch',
          },
        ],
      },
      {
        key: 'googleAndroid',
        prefix:
          " \n You've opted to allow users to authenticate via Google within an Android project.  If you haven't already, you'll need to go to https://developers.google.com/identity and create an Android Client ID. \n",
        question: 'Enter your Google Android Client ID for your identity pool: ',
        required: true,
        andConditions: [
          {
            key: 'authProviders',
            value: 'accounts.google.com',
            operator: 'includes',
          },
          {
            key: 'frontend',
            value: 'android',
            operator: 'configMatch',
          },
        ],
      },
      {
        key: 'amazonAppId',
        prefix:
          " \n You've opted to allow users to authenticate via Amazon.  If you haven't already, you'll need to create an Amazon App ID. Head to https://docs.amplify.aws/lib/auth/social/q/platform/js#setup-your-auth-provider to learn more. \n",
        question: 'Enter your Amazon App ID for your identity pool: ',
        required: true,
        andConditions: [
          {
            key: 'authProviders',
            value: 'www.amazon.com',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'userPoolName',
        question: 'Please provide a name for your user pool:',
        required: true,
        validation: {
          operator: 'regex',
          value: '^([\\w\\s+=,.@-]){1,128}$',
          onErrorMsg:
            "The user pool name must be at least 1 character and no more than 128 and only contain alphanumeric characters or the characters ',.@-'.",
        },
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            preventEdit: 'exists',
            key: 'userPoolName',
          },
        ],
      },
      {
        key: 'usernameAttributes',
        question: 'How do you want users to be able to sign in?',
        type: 'list',
        map: 'signInOptions',
        prefix: 'Warning: you will not be able to edit these selections.',
        prefixColor: 'red',
        learnMore:
          "Selecting 'Email' and/or 'Phone Number' will allow end users to sign-up using these values.  Selecting 'Username' will require a unique username for users.",
        required: true,
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            preventEdit: 'always',
          },
        ],
      },
      {
        key: 'userPoolGroups',
        question: 'Do you want to add User Pool Groups?',
        learnMore: 'This flow will help you add multiple user pool groups to your user-pool',
        required: true,
        type: 'list',
        map: 'booleanOptions',
        andConditions: [
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
      },
      {
        key: 'adminQueries',
        question: 'Do you want to add an admin queries API?',
        learnMore: 'Admin Queries API let you perform user admin functions from your frontend. See https://docs.amplify.aws/cli/auth/admin#admin-queries-api for more.',
        required: true,
        type: 'list',
        map: 'booleanOptions',
        andConditions: [
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
      },
      {
        key: 'additionalQuestions',
        question: 'Do you want to configure advanced settings?',
        type: 'list',
        map: 'additonalConfigMap',
        required: true,
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            preventEdit: 'always',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '!=',
          },
        ],
      },

      {
        key: 'mfaConfiguration',
        question: 'Multifactor authentication (MFA) user login options:',
        required: true,
        type: 'list',
        map: 'mfaOptions',
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'mfaConfiguration',
            value: 'ON',
            preventEdit: '=',
          },
          {
            key: 'mfaConfiguration',
            value: 'OPTIONAL',
            preventEdit: '=',
          },
        ],
        learnMore:
          "Multi-factor authentication (MFA) increases security for your app by adding another authentication method, and not relying solely on user name and password. You can choose to use SMS text messages, or time-based one-time (TOTP) passwords as second factors in signing in your users.\nNote that once your User Pool has been created, You can only select the 'OPTIONAL' configuration for MFA.  Similiarly, once MFA has been enabled for a User pool you cannot disable it.",
      },
      {
        key: 'mfaTypes',
        question: 'For user login, select the MFA types:',
        required: true,
        type: 'multiselect',
        map: 'mfaMethods',
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'mfaConfiguration',
            value: 'OFF',
            operator: '!=',
          },
        ],
        validation: {
          operator: 'noEmptyArray',
          onErrorMsg: 'You must select at least one MFA type from the list.',
        },
      },
      {
        key: 'smsAuthenticationMessage',
        question: 'Please specify an SMS authentication message:',
        required: true,
        type: 'input',
        validation: {
          operator: 'includes',
          value: '{####}',
          onErrorMsg:
            "Your SMS authentication message must include '{####}' representing the authentication code that the user will receive.",
        },
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'mfaConfiguration',
            value: 'OFF',
            operator: '!=',
          },
        ],
      },
      {
        key: 'autoVerifiedAttributes',
        question: 'Email based user registration/forgot password:',
        required: true,
        type: 'list',
        map: 'emailRegistration',
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
      },
      {
        key: 'emailVerificationSubject',
        question: 'Please specify an email verification subject:',
        required: true,
        type: 'input',
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'autoVerifiedAttributes',
            value: 'email',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'emailVerificationMessage',
        question: 'Please specify an email verification message:',
        required: true,
        type: 'input',
        validation: {
          operator: 'includes',
          value: '{####}',
          onErrorMsg:
            "Your email verification message must include '{####}' representing the verification code that the user will receive.",
        },
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'autoVerifiedAttributes',
            value: 'email',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'smsVerificationMessage',
        question: 'Please specify an SMS verification message:',
        required: true,
        type: 'input',
        validation: {
          operator: 'includes',
          value: '{####}',
          onErrorMsg: "Your SMS verification message must include '{####}' representing the verification code that the user will receive.",
        },
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'autoVerifiedAttributes',
            value: 'phone_number',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'defaultPasswordPolicy',
        question: 'Do you want to override the default password policy for this User Pool?',
        temp: true,
        required: true,
        type: 'confirm',
        andConditions: [
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
        ],
      },
      {
        key: 'passwordPolicyMinLength',
        question: 'Enter the minimum password length for this User Pool:',
        required: true,
        type: 'input',
        validation: {
          operator: 'range',
          value: { min: 6, max: 98 },
          onErrorMsg: 'The minimum password length must be a number and must be greater than 5 and less than 99.',
        },
        andConditions: [
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'defaultPasswordPolicy',
            value: true,
            operator: '=',
          },
        ],
      },
      {
        key: 'passwordPolicyCharacters',
        question: 'Select the password character requirements for your userpool:',
        required: true,
        type: 'multiselect',
        options: ['Requires Lowercase', 'Requires Uppercase', 'Requires Numbers', 'Requires Symbols'],
        andConditions: [
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'defaultPasswordPolicy',
            value: true,
            operator: '=',
          },
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
        ],
      },
      {
        key: 'requiredAttributes',
        question: 'What attributes are required for signing up?',
        prefix: 'Warning: you will not be able to edit these selections.',
        prefixColor: 'red',
        required: true,
        filter: 'attributes',
        requiredOptionsMsg:
          'You have already selected the following attributes as part of your user verification process.  They are required attributes by default:',
        type: 'multiselect',
        map: 'coreAttributes',
        andConditions: [
          {
            preventEdit: 'exists',
            key: 'userPoolName',
          },
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
        ],
        orConditions: [
          {
            key: 'additionalQuestions',
            value: 'triggers',
            operator: 'includes',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
      },
      {
        key: 'userpoolClientRefreshTokenValidity',
        question: "Specify the app's refresh token expiration period (in days):",
        required: true,
        andConditions: [
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
        ],
        validation: {
          operator: 'range',
          value: { min: 1, max: 3650 },
          onErrorMsg: 'Token expiration should be between 1 to 3650 days.',
        },
      },
      {
        key: 'userpoolClientSetAttributes',
        question: 'Do you want to specify the user attributes this app can read and write?',
        temp: true,
        required: true,
        andConditions: [
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
        ],
        type: 'confirm',
      },
      {
        key: 'userpoolClientReadAttributes',
        question: 'Specify read attributes:',
        required: true,
        type: 'multiselect',
        map: 'appClientReadAttributes',
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'userpoolClientSetAttributes',
            value: true,
            operator: '=',
          },
        ],
      },
      {
        key: 'userpoolClientWriteAttributes',
        question: 'Specify write attributes:',
        required: true,
        type: 'multiselect',
        map: 'coreAttributes',
        requiredOptions: ['requiredAttributes'],
        requiredOptionsMsg:
          'You have already selected the following attributes as required for this User Pool.  They are writeable by default:',
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'userpoolClientSetAttributes',
            value: true,
            operator: '=',
          },
        ],
      },
      {
        key: 'triggers',
        question: 'Do you want to enable any of the following capabilities?',
        required: true,
        type: 'multiselect',
        map: 'capabilities',
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
        ],
        orConditions: [
          {
            key: 'additionalQuestions',
            value: 'triggers',
            operator: 'includes',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
      },
      {
        key: 'hostedUI',
        question: 'Do you want to use an OAuth flow?',
        learnMore:
          'When you create a user pool in Amazon Cognito and configure a domain for it, Amazon Cognito automatically provisions a hosted web UI to let you add sign-up and sign-in pages to your app.',
        required: true,
        type: 'list',
        map: 'booleanOptions',
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
      },
      {
        key: 'hostedUIDomainName',
        question: 'What domain name prefix do you want to use?',
        required: true,
        andConditions: [
          {
            key: 'hostedUI',
            value: true,
            operator: '=',
          },
        ],
        validation: {
          operator: 'regex',
          value: '^(?!([a-z0-9]{0,1})(?!((?!aws)(?!amazon)(?!cognito).)*$))(?:[a-z0-9\\-]{0,61}[a-z0-9])?$',
          onErrorMsg:
            "The value must be a valid domain name format.  A valid format consists of lowercase alphanumeric characters or hyphens. Hyphens cannot be at the beginning or end of the string. The domain cannot use the reserved words 'aws', 'amazon', or 'cognito'.",
        },
      },
      {
        key: 'newCallbackURLs',
        question: 'Enter your redirect signin URI:',
        required: true,
        addAnotherLoop: 'redirect signin URI',
        andConditions: [
          {
            key: 'hostedUI',
            value: true,
            operator: '=',
          },
          {
            preventEdit: 'exists',
            key: 'CallbackURLs',
          },
          {
            preventEdit: 'existsInCurrent',
            key: 'CallbackURLs',
          },
        ],
        validation: {
          operator: 'regex',
          value:
            "^(((?!http://(?!localhost))([a-zA-Z0-9.]{1,})://([a-zA-Z0-9-._~:?#@!$&'()*+,;=/]{1,})/)|(?!http)(?!https)([a-zA-Z0-9.]{1,})://)$",
          onErrorMsg:
            'The value must be a valid URI with a trailing forward slash. HTTPS must be used instead of HTTP unless you are using localhost.',
        },
      },
      {
        key: 'EditURLS',
        question: 'Which redirect signin URIs do you want to edit?',
        type: 'multiselect',
        iterator: 'CallbackURLs',
        iteratorValidation: {
          operator: 'regex',
          value:
            "^(((?!http://(?!localhost))([a-zA-Z0-9.]{1,})://([a-zA-Z0-9-._~:?#@!$&'()*+,;=/]{1,})/)|(?!http)(?!https)([a-zA-Z0-9.]{1,})://)$",
          onErrorMsg:
            'The value must be a valid URI with a trailing forward slash. HTTPS must be used instead of HTTP unless you are using localhost.',
        },
        andConditions: [
          {
            key: 'CallbackURLs',
            operator: 'exists',
          },
          {
            onCreate: 'never',
          },
        ],
        orConditions: [
          {
            key: 'hostedUI',
            value: false,
            operator: '!=',
          },
          {
            key: 'updateFlow',
            value: 'callbacks',
            operator: '=',
          },
        ],
      },
      {
        key: 'addCallbackOnUpdate',
        question: 'Do you want to add redirect signin URIs?',
        required: true,
        type: 'confirm',
        andConditions: [
          {
            onCreate: 'never',
          },
          {
            preventEdit: 'existsInCurrent',
            key: 'newCallbackURLs',
          },
        ],
        orConditions: [
          {
            key: 'hostedUI',
            value: false,
            operator: '!=',
          },
          {
            key: 'updateFlow',
            value: 'callbacks',
            operator: '=',
          },
        ],
      },
      {
        key: 'newCallbackURLs',
        question: 'Enter your new redirect signin URI:',
        required: true,
        concatKey: 'CallbackURLs',
        addAnotherLoop: 'redirect signin URI',
        andConditions: [
          {
            key: 'addCallbackOnUpdate',
            value: true,
            operator: '=',
          },
          {
            onCreate: 'never',
          },
        ],
        validation: {
          operator: 'regex',
          value:
            "^(((?!http://(?!localhost))([a-zA-Z0-9.]{1,})://([a-zA-Z0-9-._~:?#@!$&'()*+,;=/]{1,})/)|(?!http)(?!https)([a-zA-Z0-9.]{1,})://)$",
          onErrorMsg:
            'The value must be a valid URI with a trailing forward slash. HTTPS must be used instead of HTTP unless you are using localhost.',
        },
      },
      {
        key: 'newLogoutURLs',
        question: 'Enter your redirect signout URI:',
        required: true,
        addAnotherLoop: 'redirect signout URI',
        andConditions: [
          {
            key: 'hostedUI',
            value: true,
            operator: '=',
          },
          {
            preventEdit: 'exists',
            key: 'LogoutURLs',
          },
          {
            preventEdit: 'existsInCurrent',
            key: 'LogoutURLs',
          },
        ],
        validation: {
          operator: 'regex',
          value:
            "^(((?!http://(?!localhost))([a-zA-Z0-9.]{1,})://([a-zA-Z0-9-._~:?#@!$&'()*+,;=/]{1,})/)|(?!http)(?!https)([a-zA-Z0-9.]{1,})://)$",
          onErrorMsg:
            'The value must be a valid URI with a trailing forward slash. HTTPS must be used instead of HTTP unless you are using localhost.',
        },
      },
      {
        key: 'editLogoutURLs',
        question: 'Which redirect signout URIs do you want to edit?',
        type: 'multiselect',
        iterator: 'LogoutURLs',
        iteratorValidation: {
          operator: 'regex',
          value:
            "^(((?!http://(?!localhost))([a-zA-Z0-9.]{1,})://([a-zA-Z0-9-._~:?#@!$&'()*+,;=/]{1,})/)|(?!http)(?!https)([a-zA-Z0-9.]{1,})://)$",
          onErrorMsg:
            'The value must be a valid URI with a trailing forward slash. HTTPS must be used instead of HTTP unless you are using localhost.',
        },
        andConditions: [
          {
            key: 'LogoutURLs',
            operator: 'exists',
          },
          {
            onCreate: 'never',
          },
        ],
        orConditions: [
          {
            key: 'hostedUI',
            value: false,
            operator: '!=',
          },
          {
            key: 'updateFlow',
            value: 'callbacks',
            operator: '=',
          },
        ],
      },
      {
        key: 'addLogoutOnUpdate',
        question: 'Do you want to add redirect signout URIs?',
        required: true,
        type: 'confirm',
        andConditions: [
          {
            onCreate: 'never',
          },
          {
            preventEdit: 'existsInCurrent',
            key: 'newLogoutURLs',
          },
        ],
        orConditions: [
          {
            key: 'hostedUI',
            value: false,
            operator: '!=',
          },
          {
            key: 'updateFlow',
            value: 'callbacks',
            operator: '=',
          },
        ],
      },
      {
        key: 'newLogoutURLs',
        question: 'Enter your new redirect signout URI:',
        required: true,
        concatKey: 'LogoutURLs',
        addAnotherLoop: 'redirect signout URI',
        andConditions: [
          {
            key: 'addLogoutOnUpdate',
            value: true,
            operator: '=',
          },
          {
            onCreate: 'never',
          },
        ],
        validation: {
          operator: 'regex',
          value:
            "^(((?!http://(?!localhost))([a-zA-Z0-9.]{1,})://([a-zA-Z0-9-._~:?#@!$&'()*+,;=/]{1,})/)|(?!http)(?!https)([a-zA-Z0-9.]{1,})://)$",
          onErrorMsg:
            'The value must be a valid URI with a trailing forward slash. HTTPS must be used instead of HTTP unless you are using localhost.',
        },
      },
      {
        key: 'AllowedOAuthFlows',
        question: 'Select the OAuth flows enabled for this project.',
        required: true,
        type: 'list',
        map: 'oAuthFlows',
        andConditions: [
          {
            key: 'hostedUI',
            value: true,
            operator: '=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
          {
            key: 'frontend',
            value: 'javascript',
            operator: 'configMatch',
          },
        ],
      },
      {
        key: 'AllowedOAuthScopes',
        question: 'Select the OAuth scopes enabled for this project.',
        required: true,
        type: 'multiselect',
        map: 'oAuthScopes',
        andConditions: [
          {
            key: 'hostedUI',
            value: true,
            operator: '=',
          },
          {
            key: 'useDefault',
            value: 'manual',
            operator: '=',
          },
        ],
      },
      {
        key: 'authProvidersUserPool',
        question: 'Select the social providers you want to configure for your user pool:',
        temp: true,
        type: 'multiselect',
        filter: 'providers',
        map: 'hostedUIProviders',
        required: true,
        andConditions: [
          {
            key: 'authSelections',
            value: 'identityPoolOnly',
            operator: '!=',
          },
          {
            key: 'hostedUI',
            value: true,
            operator: '=',
          },
          {
            preventEdit: 'always',
          },
        ],
      },
      {
        key: 'authProvidersUserPool',
        question: 'Select the identity providers you want to configure for your user pool:',
        temp: true,
        type: 'multiselect',
        map: 'hostedUIProviders',
        required: true,
        andConditions: [
          {
            onCreate: 'never',
          },
        ],
        orConditions: [
          {
            key: 'hostedUI',
            value: false,
            operator: '!=',
          },
          {
            key: 'updateFlow',
            value: 'providers',
            operator: '=',
          },
        ],
      },
      {
        key: 'facebookAppIdUserPool',
        prefix:
          " \n You've opted to allow users to authenticate via Facebook.  If you haven't already, you'll need to go to https://developers.facebook.com and create an App ID. \n",
        question: 'Enter your Facebook App ID for your OAuth flow: ',
        required: true,
        andConditions: [
          {
            key: 'authProvidersUserPool',
            value: 'Facebook',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'facebookAppSecretUserPool',
        question: 'Enter your Facebook App Secret for your OAuth flow: ',
        required: true,
        andConditions: [
          {
            key: 'authProvidersUserPool',
            value: 'Facebook',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'googleAppIdUserPool',
        prefix:
          " \n You've opted to allow users to authenticate via Google.  If you haven't already, you'll need to go to https://developers.google.com/identity and create an App ID. \n",
        question: 'Enter your Google Web Client ID for your OAuth flow: ',
        required: true,
        andConditions: [
          {
            key: 'authProvidersUserPool',
            value: 'Google',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'googleAppSecretUserPool',
        question: 'Enter your Google Web Client Secret for your OAuth flow: ',
        required: true,
        andConditions: [
          {
            key: 'authProvidersUserPool',
            value: 'Google',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'loginwithamazonAppIdUserPool',
        prefix:
          " \n You've opted to allow users to authenticate via Amazon.  If you haven't already, you'll need to create an Amazon App ID. Head to https://docs.amplify.aws/lib/auth/social/q/platform/js#setup-your-auth-provider to learn more. \n",
        question: 'Enter your Amazon App ID for your OAuth flow: ',
        required: true,
        andConditions: [
          {
            key: 'authProvidersUserPool',
            value: 'LoginWithAmazon',
            operator: 'includes',
          },
        ],
      },
      {
        key: 'loginwithamazonAppSecretUserPool',
        question: 'Enter your Amazon App Secret for your OAuth flow: ',
        required: true,
        andConditions: [
          {
            key: 'authProvidersUserPool',
            value: 'LoginWithAmazon',
            operator: 'includes',
          },
        ],
      },
    ],
    cfnFilename: 'auth-template.yml.ejs',
    defaultValuesFilename: 'cognito-defaults.js',
    serviceWalkthroughFilename: 'auth-questions.js',
    stringMapsFilename: 'string-maps.js',
    provider: 'awscloudformation',
  },
};
