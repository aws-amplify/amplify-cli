import _ from 'lodash';
import { getCLIPath, getSocialProviders, KEY_DOWN_ARROW, KEY_UP_ARROW, nspawn as spawn, setTransformerVersionFlag } from '..';

export type AddAuthUserPoolOnlyNoOAuthSettings = {
  resourceName: string;
  userPoolName: string;
};

export type AddAuthUserPoolOnlyWithOAuthSettings = AddAuthUserPoolOnlyNoOAuthSettings & {
  domainPrefix: string;
  signInUrl1: string;
  signInUrl2: string;
  signOutUrl1: string;
  signOutUrl2: string;
  facebookAppId: string;
  facebookAppSecret: string;
  googleAppId: string;
  googleAppSecret: string;
  amazonAppId: string;
  amazonAppSecret: string;
  appleAppClientId: string;
  appleAppTeamId: string;
  appleAppKeyID: string;
  appleAppPrivateKey: string;
};

export type AddAuthIdentityPoolAndUserPoolWithOAuthSettings = AddAuthUserPoolOnlyWithOAuthSettings & {
  identityPoolName: string;
  allowUnauthenticatedIdentities: boolean;
  idpFacebookAppId: string;
  idpGoogleAppId: string;
  idpAmazonAppId: string;
  idpAppleAppId: string;
};

export const addAuthWithDefault = async (cwd: string, settings: any = {}, testingWithLatestCodebase = false): Promise<void> => {
  return spawn(getCLIPath(testingWithLatestCodebase), ['add', 'auth'], { cwd, stripColors: true })
    .wait('Do you want to use the default authentication')
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in')
    .sendCarriageReturn()
    .wait('Do you want to configure advanced settings?')
    .sendCarriageReturn()
    .sendEof()
    .runAsync();
};

export function runAmplifyAuthConsole(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['auth', 'console'], { cwd, stripColors: true })
      .wait('Which console')
      .sendCarriageReturn()
      .wait('Identity Pool console:')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function removeAuthWithDefault(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['remove', 'auth'], { cwd, stripColors: true })
      .wait('Choose the resource you would want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to delete the resource? This')
      .sendYes()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export const addAuthWithGroupTrigger = async (cwd: string, settings: any): Promise<void> => {
  return spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
    .wait('Do you want to use the default authentication and security configuration?')
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in')
    .sendCarriageReturn()
    .wait('Do you want to configure advanced settings?')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('What attributes are required for signing up?')
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .wait('(Use <space> to select, <ctrl + a> to toggle all)')
    .sendKeyDown()
    .sendKeyDown()
    .send(' ')
    .sendCarriageReturn()
    .wait('Enter the name of the group to which users will be added.')
    .sendLine('mygroup')
    .wait('Do you want to edit your add-to-group function now?')
    .sendNo()
    .sendEof()
    .runAsync();
};

export async function addAuthWithEmailVerificationAndUserPoolGroupTriggers(cwd: string): Promise<void> {
  return spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
    .wait('Do you want to use the default authentication and security configuration?')
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in')
    .sendKeyDown() // Email
    .sendCarriageReturn()
    .wait('Do you want to configure advanced settings?')
    .sendKeyDown()
    .sendCarriageReturn()
    .wait('What attributes are required for signing up?')
    .sendKeyDown(8)
    .send(' ') // Name
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .sendKeyDown()
    .send(' ') // Email Verification Link with Redirect
    .sendKeyDown()
    .send(' ') // Add User to Group
    .sendCarriageReturn()
    .wait('Enter the URL that your users will be redirected to upon account confirmation:')
    .sendCarriageReturn()
    .wait('Enter the subject for your custom account confirmation email:')
    .sendCarriageReturn()
    .wait('Enter the body text for your custom account confirmation email (this will appear before the link URL):')
    .sendCarriageReturn()
    .wait('Do you want to edit your verification-link function now?')
    .sendNo()
    .wait('Enter the name of the group to which users will be added.')
    .sendLine('admin')
    .wait('Do you want to edit your add-to-group function now?')
    .sendNo()
    .sendEof()
    .runAsync();
}

interface AddApiOptions {
  apiName: string;
  testingWithLatestCodebase: boolean;
  transformerVersion: number;
}

const defaultOptions: AddApiOptions = {
  apiName: '\r',
  testingWithLatestCodebase: true,
  transformerVersion: 2,
};

export const addAuthViaAPIWithTrigger = async (cwd: string, opts: Partial<AddApiOptions> = {}): Promise<void> => {
  const options = _.assign(defaultOptions, opts);
  await spawn(getCLIPath(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
    .wait('Select from one of the below mentioned services:')
    .sendCarriageReturn()
    .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
    .sendKeyUp(2)
    .sendCarriageReturn()
    .wait('Choose the default authorization type for the API')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to use the default authentication and security configuration?')
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in')
    .sendCarriageReturn()
    .wait('Do you want to configure advanced settings?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('What attributes are required for signing up?')
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(' ')
    .sendCarriageReturn()
    .wait('Enter the name of the group to which users will be added.')
    .sendLine('mygroup')
    .wait('Do you want to edit your add-to-group function now?')
    .sendNo()
    .wait(/.*Configure additional auth types.*/)
    .sendNo()
    .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
    .sendCarriageReturn()
    .wait('Choose a schema template:')
    .sendCarriageReturn()
    .wait('Do you want to edit the schema now?')
    .sendNo()
    .runAsync();

  setTransformerVersionFlag(cwd, options.transformerVersion);
};

export const addAuthwithUserPoolGroupsViaAPIWithTrigger = async (cwd: string, opts: Partial<AddApiOptions> = {}): Promise<void> => {
  const options = _.assign(defaultOptions, opts);
  await spawn(getCLIPath(options.testingWithLatestCodebase), ['add', 'api'], { cwd, stripColors: true })
    .wait('Select from one of the below mentioned services:')
    .sendCarriageReturn()
    .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
    .sendKeyUp(2)
    .sendCarriageReturn()
    .wait('Choose the default authorization type for the API')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to use the default authentication and security configuration?')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Select the authentication/authorization services that you want to use:')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Provide a friendly name for your resource that will be used to label this category in the project:')
    .sendCarriageReturn()
    .wait('Provide a name for your user pool:')
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in')
    .sendCarriageReturn()
    .wait('Do you want to add User Pool Groups?')
    .sendCarriageReturn()
    .wait('Provide a name for your user pool group:')
    .sendLine('admin')
    .wait('Do you want to add another User Pool Group')
    .sendCarriageReturn()
    .wait('Sort the user pool groups in order of preference')
    .sendCarriageReturn()
    .wait('Do you want to add an admin queries API?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Multifactor authentication (MFA) user login options:')
    .sendCarriageReturn()
    .wait('Email based user registration/forgot password:')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Specify an SMS verification message:')
    .sendCarriageReturn()
    .wait('Do you want to override the default password policy for this User Pool?')
    .sendCarriageReturn()
    .wait('What attributes are required for signing up?')
    .sendCarriageReturn()
    .wait(`Specify the app's refresh token expiration period (in days):`)
    .sendCarriageReturn()
    .wait('Do you want to specify the user attributes this app can read and write?')
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(' ')
    .sendCarriageReturn()
    .wait('Do you want to use an OAuth flow?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to configure Lambda Triggers for Cognito?')
    .sendCarriageReturn()
    .wait('Which triggers do you want to enable for Cognito')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Post Confirmation')
    .sendCarriageReturn()
    .wait('Enter the name of the group to which users will be added.')
    .sendLine('mygroup')
    .wait('Do you want to edit your add-to-group function now?')
    .sendNo()
    .wait(/.*Configure additional auth types.*/)
    .sendNo()
    .wait(/.*Here is the GraphQL API that we will create. Select a setting to edit or continue.*/)
    .sendCarriageReturn()
    .wait('Choose a schema template:')
    .sendCarriageReturn()
    .wait('Do you want to edit the schema now?')
    .sendNo()
    .runAsync();

  setTransformerVersionFlag(cwd, options.transformerVersion);
};

export const addAuthWithCustomTrigger = async (cwd: string, settings: any): Promise<void> => {
  return spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
    .wait('Do you want to use the default authentication and security configuration?')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Select the authentication/authorization services that you want to use:')
    .sendCarriageReturn()
    .wait('Provide a friendly name')
    .sendCarriageReturn()
    .wait('Enter a name for your identity pool.')
    .sendCarriageReturn()
    .wait('Allow unauthenticated logins?')
    .sendCarriageReturn()
    .wait('Do you want to enable 3rd party authentication providers in your identity pool?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Provide a name for your user pool:')
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in?')
    .sendCarriageReturn()
    .wait('Do you want to add User Pool Groups?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to add an admin queries API?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Multifactor authentication (MFA) user login options:')
    .sendCarriageReturn()
    .wait('Email based user registration/forgot password:')
    .sendCarriageReturn()
    .wait('Specify an email verification subject:')
    .sendCarriageReturn()
    .wait('Specify an email verification message:')
    .sendCarriageReturn()
    .wait('Do you want to override the default password policy for this User Pool?')
    .sendCarriageReturn()
    .wait(' What attributes are required for signing up?')
    .sendCarriageReturn()
    .wait("Specify the app's refresh token expiration period (in days):")
    .sendCarriageReturn()
    .wait('Do you want to specify the user attributes this app can read and write?')
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(' ')
    .sendCarriageReturn()
    .wait('Do you want to use an OAuth flow?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to configure Lambda Triggers for Cognito?')
    .sendCarriageReturn()
    .wait('Which triggers do you want to enable for Cognito')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Pre Sign-up')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(' ')
    .sendCarriageReturn()
    .wait('Enter a comma-delimited list of disallowed email domains')
    .sendLine('amazon.com')
    .wait('Successfully')
    .wait(`Do you want to edit your email-filter-denylist${settings.useInclusiveTerminology === false ? '-legacy' : ''} function now?`)
    .sendNo()
    .wait('Do you want to edit your custom function now')
    .sendNo()
    .runAsync();
};

export const updateAuthSignInSignOutUrl = (cwd: string, settings: any): Promise<void> => {
  const testingWithLatestCodebase = settings.testingWithLatestCodebase ?? false;

  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'auth'], { cwd, stripColors: true });
  if (settings?.overrides?.category === 'auth') {
    chain.wait('A migration is needed to support latest updates on auth resources').sendYes();
  }
  return chain
    .wait('What do you want to do?')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Which redirect signin URIs do you want to edit?')
    .sendCtrlA()
    .sendCarriageReturn()
    .wait(`Update ${settings.signinUrl}`)
    .sendCarriageReturn()
    .send(settings.updatesigninUrl)
    .sendCarriageReturn()
    .wait('Do you want to add redirect signin URIs?')
    .sendNo()
    .wait('Which redirect signout URIs do you want to edit?')
    .sendCtrlA()
    .sendCarriageReturn()
    .wait(`Update ${settings.signoutUrl}`)
    .send(settings.updatesignoutUrl)
    .sendCarriageReturn()
    .wait('Do you want to add redirect signout URIs?')
    .sendNo()
    .sendEof()
    .runAsync();
};

export const updateAuthToRemoveFederation = async (cwd: string, settings: any): Promise<void> => {
  const testingWithLatestCodebase = settings.testingWithLatestCodebase ?? false;

  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'auth'], { cwd, stripColors: true });
  if (settings?.overrides?.category === 'auth') {
    chain.wait('A migration is needed to support latest updates on auth resources').sendYes();
  }
  return chain
    .wait('What do you want to do?')
    .sendCarriageReturn()
    .wait('"amplify publish" will build all your local backend and frontend resources')
    .sendEof()
    .runAsync();
};

export const updateAuthWithoutCustomTrigger = async (cwd: string, settings: any): Promise<void> => {
  const testingWithLatestCodebase = settings.testingWithLatestCodebase ?? false;

  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'auth'], { cwd, stripColors: true });
  if (settings?.overrides?.category === 'auth') {
    chain.wait('A migration is needed to support latest updates on auth resources').sendYes();
  }
  return chain
    .wait('What do you want to do?')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Select the authentication/authorization services that you want to use:')
    .sendCarriageReturn()
    .wait('Allow unauthenticated logins?')
    .sendCarriageReturn()
    .wait('Do you want to enable 3rd party authentication providers in your identity pool?')
    .sendCarriageReturn()
    .wait('Do you want to add User Pool Groups?')
    .sendCarriageReturn()
    .wait('Do you want to add an admin queries API?')
    .sendCarriageReturn()
    .wait('Multifactor authentication (MFA) user login options:')
    .sendCarriageReturn()
    .wait('Email based user registration/forgot password:')
    .sendCarriageReturn()
    .wait('Specify an email verification subject:')
    .sendCarriageReturn()
    .wait('Specify an email verification message:')
    .sendCarriageReturn()
    .wait('Do you want to override the default password policy for this User Pool?')
    .sendCarriageReturn()
    .wait("Specify the app's refresh token expiration period (in days):")
    .sendCarriageReturn()
    .wait('Do you want to specify the user attributes this app can read and write?')
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .sendCarriageReturn()
    .wait('Do you want to use an OAuth flow?')
    .sendCarriageReturn()
    .wait('Do you want to configure Lambda Triggers for Cognito?')
    .sendCarriageReturn()
    .wait('Which triggers do you want to enable for Cognito')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Pre Sign-up')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(' ')
    .sendCarriageReturn()
    .runAsync();
};

export const addAuthWithRecaptchaTrigger = async (cwd: string, settings: any): Promise<void> => {
  return spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
    .wait('Do you want to use the default authentication and security configuration?')
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in?')
    .sendCarriageReturn()
    .wait('Do you want to configure advanced settings?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('What attributes are required for signing up?')
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .send(' ')
    .sendCarriageReturn()
    .wait('Do you want to edit your captcha-define-challenge function now?')
    .sendNo()
    .wait('Do you want to edit your captcha-create-challenge function now?')
    .sendNo()
    .wait('Enter the Google reCaptcha secret key:')
    .sendLine('dummykey')
    .wait('Do you want to edit your captcha-verify function now?')
    .sendNo()
    .runAsync();
};

export const updateAuthRemoveRecaptchaTrigger = async (cwd: string, settings: any): Promise<void> => {
  const testingWithLatestCodebase = settings.testingWithLatestCodebase ?? false;
  console.log(testingWithLatestCodebase);
  console.log(settings);

  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'auth'], { cwd, stripColors: true });
  if (settings?.overrides?.category === 'auth') {
    chain.wait('A migration is needed to support latest updates on auth resources').sendYes();
  }
  return chain
    .wait('What do you want to do')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Select the authentication/authorization services')
    .sendCarriageReturn()
    .wait('Allow unauthenticated logins?')
    .sendCarriageReturn()
    .wait('Do you want to enable 3rd party authentication providers')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to add User Pool Groups?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to add an admin queries API?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Multifactor authentication (MFA) user login options')
    .sendCarriageReturn()
    .wait('Email based user registration/forgot password')
    .sendCarriageReturn()
    .wait('Specify an email verification subject:')
    .sendCarriageReturn()
    .wait('Specify an email verification message')
    .sendCarriageReturn()
    .wait('Do you want to override the default password policy for this')
    .sendCarriageReturn()
    .wait('Specify the app')
    .sendCarriageReturn()
    .wait('Do you want to specify the user attributes')
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities')
    .sendCtrlA()
    .sendCtrlA()
    .sendCarriageReturn()
    .wait('Do you want to use an OAuth')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to configure Lambda Triggers for Cognito')
    .sendNo()
    .runAsync();
};

export const addAuthWithSignInSignOutUrl = async (cwd: string, settings: any): Promise<void> => {
  return spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
    .wait('Do you want to use the default authentication and security configuration?')
    .sendLine(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in?')
    .sendCarriageReturn()
    .wait('Do you want to configure advanced settings?')
    .sendCarriageReturn()
    .wait('What domain name prefix do you want to use?')
    .sendCarriageReturn()
    .wait('Enter your redirect signin URI:')
    .sendLine(settings.signinUrl)
    .wait('Do you want to add another redirect signin URI')
    .sendNo()
    .sendCarriageReturn()
    .wait('Enter your redirect signout URI:')
    .sendLine(settings.signoutUrl)
    .sendCarriageReturn()
    .wait('Do you want to add another redirect signout URI')
    .sendNo()
    .sendCarriageReturn()
    .wait('Select the social providers you want to configure for your user pool:')
    .sendCarriageReturn()
    .sendEof()
    .runAsync();
};

export function addAuthWithDefaultSocial_v4_30(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, GOOGLE_APP_ID, GOOGLE_APP_SECRET, AMAZON_APP_ID, AMAZON_APP_SECRET } = getSocialProviders(
      true,
    );

    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration?')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('How do you want users to be able to sign in?')
      .sendCarriageReturn()
      .wait('Do you want to configure advanced settings?')
      .sendCarriageReturn()
      .wait('What domain name prefix do you want to use?')
      .sendCarriageReturn()
      .wait('Enter your redirect signin URI:')
      .sendLine('https://www.google.com/')
      .wait('Do you want to add another redirect signin URI')
      .sendNo()
      .wait('Enter your redirect signout URI:')
      .sendLine('https://www.nytimes.com/')
      .wait('Do you want to add another redirect signout URI')
      .sendNo()
      .wait('Select the social providers you want to configure for your user pool:')
      .sendCtrlA()
      .sendCarriageReturn()
      .wait('Enter your Facebook App ID for your OAuth flow:')
      .send(FACEBOOK_APP_ID)
      .sendCarriageReturn()
      .wait('Enter your Facebook App Secret for your OAuth flow:')
      .send(FACEBOOK_APP_SECRET)
      .sendCarriageReturn()
      .wait('Enter your Google Web Client ID for your OAuth flow:')
      .send(GOOGLE_APP_ID)
      .sendCarriageReturn()
      .wait('Enter your Google Web Client Secret for your OAuth flow:')
      .send(GOOGLE_APP_SECRET)
      .sendCarriageReturn()
      .wait('Enter your Amazon App ID for your OAuth flow:')
      .send(AMAZON_APP_ID)
      .sendCarriageReturn()
      .wait('Enter your Amazon App Secret for your OAuth flow:')
      .send(AMAZON_APP_SECRET)
      .sendCarriageReturn()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addAuthWithDefaultSocial(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const {
      FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET,
      GOOGLE_APP_ID,
      GOOGLE_APP_SECRET,
      AMAZON_APP_ID,
      AMAZON_APP_SECRET,
      APPLE_APP_ID,
      APPLE_TEAM_ID,
      APPLE_KEY_ID,
      APPLE_PRIVATE_KEY,
    } = getSocialProviders(true);

    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration?')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('How do you want users to be able to sign in?')
      .sendCarriageReturn()
      .wait('Do you want to configure advanced settings?')
      .sendCarriageReturn()
      .wait('What domain name prefix do you want to use?')
      .sendCarriageReturn()
      .wait('Enter your redirect signin URI:')
      .sendLine('https://www.google.com/')
      .wait('Do you want to add another redirect signin URI')
      .sendNo()
      .wait('Enter your redirect signout URI:')
      .sendLine('https://www.nytimes.com/')
      .wait('Do you want to add another redirect signout URI')
      .sendNo()
      .wait('Select the social providers you want to configure for your user pool:')
      .sendCtrlA()
      .sendCarriageReturn()
      .wait('Enter your Facebook App ID for your OAuth flow:')
      .send(FACEBOOK_APP_ID)
      .sendCarriageReturn()
      .wait('Enter your Facebook App Secret for your OAuth flow:')
      .send(FACEBOOK_APP_SECRET)
      .sendCarriageReturn()
      .wait('Enter your Google Web Client ID for your OAuth flow:')
      .send(GOOGLE_APP_ID)
      .sendCarriageReturn()
      .wait('Enter your Google Web Client Secret for your OAuth flow:')
      .send(GOOGLE_APP_SECRET)
      .sendCarriageReturn()
      .wait('Enter your Amazon App ID for your OAuth flow:')
      .send(AMAZON_APP_ID)
      .sendCarriageReturn()
      .wait('Enter your Amazon App Secret for your OAuth flow:')
      .send(AMAZON_APP_SECRET)
      .sendCarriageReturn()
      .wait('Enter your Services ID for your OAuth flow:')
      .send(APPLE_APP_ID)
      .sendCarriageReturn()
      .wait('Enter your Team ID for your OAuth flow:')
      .send(APPLE_TEAM_ID)
      .sendCarriageReturn()
      .wait('Enter your Key ID for your OAuth flow:')
      .send(APPLE_KEY_ID)
      .sendCarriageReturn()
      .wait('Enter your Private Key for your OAuth flow:')
      .send(APPLE_PRIVATE_KEY)
      .sendCarriageReturn()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addAuthUserPoolOnly(cwd: string, settings: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const {
      FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET,
      GOOGLE_APP_ID,
      GOOGLE_APP_SECRET,
      AMAZON_APP_ID,
      AMAZON_APP_SECRET,
      APPLE_APP_ID,
      APPLE_TEAM_ID,
      APPLE_KEY_ID,
      APPLE_PRIVATE_KEY,
    } = getSocialProviders(true);

    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration?')
      .sendKeyDown(2)
      .sendCarriageReturn()
      .wait('Select the authentication/authorization services that you want to use')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource that will be used')
      .sendCarriageReturn()
      .wait('Provide a name for your user pool')
      .sendCarriageReturn()
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn()
      .wait('Do you want to add User Pool Groups?')
      .sendCarriageReturn()
      .wait('Provide a name for your user pool group')
      .sendLine('userPoolGroup1')
      .wait('Do you want to add another User Pool Group')
      .sendYes()
      .wait('Provide a name for your user pool group')
      .sendLine('userPoolGroup2')
      .wait('Do you want to add another User Pool Group')
      .sendCarriageReturn()
      .wait('Sort the user pool groups in order of preference')
      .sendCarriageReturn()
      .wait('Do you want to add an admin queries API?')
      .sendCarriageReturn()
      .wait('Do you want to restrict access to the admin queries API')
      .sendCarriageReturn()
      .wait('Select the group to restrict access with')
      .sendCarriageReturn()
      .wait('Multifactor authentication (MFA) user login options')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('For user login, select the MFA types')
      .sendLine('a')
      .wait('Specify an SMS authentication message')
      .sendCarriageReturn()
      .wait('Email based user registration/forgot password')
      .sendCarriageReturn()
      .wait('Specify an email verification subject')
      .sendCarriageReturn()
      .wait('Specify an email verification message')
      .sendCarriageReturn()
      .wait('Do you want to override the default password policy')
      .sendYes()
      .wait('Enter the minimum password length for this User Pool')
      .sendCarriageReturn()
      .wait('Select the password character requirements for your userpool')
      .sendLine('a')
      .wait('What attributes are required for signing up?')
      .sendCarriageReturn()
      .wait('Specify the app')
      .sendCarriageReturn()
      .wait('Do you want to specify the user attributes this app')
      .sendYes()
      .wait('Specify read attributes')
      .sendCarriageReturn()
      .wait('Specify write attributes')
      .sendCarriageReturn()
      .wait('Do you want to enable any of the following capabilities?')
      .sendCarriageReturn()
      .wait('Do you want to use an OAuth flow')
      .sendCarriageReturn()
      .wait('What domain name prefix do you want to use?')
      .sendCarriageReturn()
      .wait('Enter your redirect signin URI')
      .sendLine('https://signin1/')
      .wait('Do you want to add another redirect signin URI')
      .sendNo()
      .wait('Enter your redirect signout URI')
      .sendLine('https://signout1/')
      .wait('Do you want to add another redirect signout URI')
      .sendNo()
      .wait('Select the OAuth flows enabled for this project')
      .sendCarriageReturn()
      .wait('Select the OAuth scopes enabled for this project')
      .sendCarriageReturn()
      .wait('Select the social providers you want to configure for your user pool')
      .sendLine('a')
      .wait('Enter your Facebook App ID for your OAuth flow')
      .sendLine(FACEBOOK_APP_ID)
      .wait('Enter your Facebook App Secret for your OAuth flow')
      .sendLine(FACEBOOK_APP_SECRET)
      .wait('Enter your Google Web Client ID for your OAuth flow')
      .sendLine(GOOGLE_APP_ID)
      .wait('Enter your Google Web Client Secret for your OAuth flow')
      .sendLine(GOOGLE_APP_SECRET)
      .wait('Enter your Amazon App ID for your OAuth flow')
      .sendLine(AMAZON_APP_ID)
      .wait('Enter your Amazon App Secret for your OAuth flow')
      .sendLine(AMAZON_APP_SECRET)
      .wait('Enter your Services ID for your OAuth flow')
      .sendLine(APPLE_APP_ID)
      .wait('Enter your Team ID for your OAuth flow')
      .sendLine(APPLE_TEAM_ID)
      .wait('Enter your Key ID for your OAuth flow')
      .sendLine(APPLE_KEY_ID)
      .wait('Enter your Private Key for your OAuth flow')
      .sendLine(APPLE_PRIVATE_KEY)
      .wait('Do you want to configure Lambda Triggers for Cognito')
      .sendYes()
      .wait('Which triggers do you want to enable for Cognito')
      .sendCtrlA()
      .sendLine(' ')
      .wait('What functionality do you want to use for Create Auth Challenge')
      .sendKeyDown(3)
      .sendLine(' ')
      .wait('What functionality do you want to use for Custom Message')
      .sendKeyDown(2)
      .sendLine(' ')
      .wait('What functionality do you want to use for Define Auth Challenge')
      .sendKeyDown(3)
      .sendLine(' ')
      .wait('What functionality do you want to use for Post Authentication')
      .sendCarriageReturn()
      .wait('What functionality do you want to use for Post Confirmation')
      .sendCarriageReturn()
      .wait('What functionality do you want to use for Pre Authentication')
      .sendCarriageReturn()
      .wait('What functionality do you want to use for Pre Sign-up')
      .sendCarriageReturn()
      .wait('What functionality do you want to use for Verify')
      .sendCarriageReturn()
      .wait('What functionality do you want to use for Pre Token')
      .sendCarriageReturn()
      .wait('Do you want to edit your custom function now')
      .sendNo()
      .wait('Successfully')
      .wait('Do you want to edit your custom function now')
      .sendNo()
      .wait('Successfully')
      .wait('Do you want to edit your custom function now')
      .sendNo()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

// creates 2 groups: Admins, Users
export function addAuthWithGroups(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration')
      .sendKeyDown(2)
      .sendCarriageReturn() // Manual configuration
      .wait('Select the authentication/authorization services that you want to use')
      .sendCarriageReturn() // for sign-up/-in and IAM controls
      .wait('Provide a friendly name for your resource that will be used')
      .sendCarriageReturn() // Default
      .wait('Enter a name for your identity pool')
      .sendCarriageReturn() // Default
      .wait('Allow unauthenticated logins')
      .sendCarriageReturn() // No
      .wait('Do you want to enable 3rd party authentication providers')
      .sendKeyDown()
      .sendCarriageReturn() // No
      .wait('Provide a name for your user pool')
      .sendCarriageReturn() // Default
      .wait('Warning: you will not be able to edit these selections')
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn() // Username
      .wait('Do you want to add User Pool Groups')
      .sendCarriageReturn() // Yes
      .wait('Provide a name for your user pool group')
      .sendLine('Admins')
      .wait('Do you want to add another User Pool Group')
      .sendYes()
      .wait('Provide a name for your user pool group')
      .sendLine('Users')
      .wait('Do you want to add another User Pool Group')
      .sendNo()
      .wait('Sort the user pool groups in order of preference')
      .sendCarriageReturn() // As is, Admins, Users
      .wait('Do you want to add an admin queries API')
      .sendKeyDown()
      .sendCarriageReturn() // No
      .wait('Multifactor authentication (MFA) user login options')
      .sendCarriageReturn() // Select Off
      .wait('Email based user registration/forgot password')
      .sendCarriageReturn() // Enabled
      .wait('Specify an email verification subject')
      .sendCarriageReturn() // Your verification code
      .wait('Specify an email verification message')
      .sendCarriageReturn() // Your verification code is {####}
      .wait('Do you want to override the default password policy')
      .sendNo()
      .wait('What attributes are required for signing up')
      .sendCarriageReturn() // Email
      .wait("Specify the app's refresh token expiration period")
      .sendCarriageReturn() // 30
      .wait('Do you want to specify the user attributes this app can read and write')
      .sendNo()
      .wait('Do you want to enable any of the following capabilities')
      .sendCarriageReturn() // None
      .wait('Do you want to use an OAuth flow')
      .sendKeyDown()
      .sendCarriageReturn() // No
      .wait('Do you want to configure Lambda Triggers for Cognito')
      .sendNo()
      .sendEof()
      .run((err: Error) => (err ? reject(err) : resolve()));
  });
}

// creates 2 groups: Admins, Users
export function addAuthWithGroupsAndAdminAPI(cwd: string, settings?: any): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration')
      .sendKeyDown(2)
      .sendCarriageReturn() // Manual configuration
      .wait('Select the authentication/authorization services that you want to use')
      .sendCarriageReturn() // for sign-up/-in and IAM controls
      .wait('Provide a friendly name for your resource that will be used')
      .sendCarriageReturn() // Default
      .wait('Enter a name for your identity pool')
      .sendCarriageReturn() // Default
      .wait('Allow unauthenticated logins')
      .sendCarriageReturn() // No
      .wait('Do you want to enable 3rd party authentication providers')
      .sendKeyDown()
      .sendCarriageReturn() // No
      .wait('Provide a name for your user pool')
      .sendCarriageReturn() // Default
      .wait('Warning: you will not be able to edit these selections')
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn() // Username
      .wait('Do you want to add User Pool Groups')
      .sendCarriageReturn() // Yes
      .wait('Provide a name for your user pool group')
      .sendLine('Admins')
      .wait('Do you want to add another User Pool Group')
      .sendYes()
      .wait('Provide a name for your user pool group')
      .sendLine('Users')
      .wait('Do you want to add another User Pool Group')
      .sendNo()
      .wait('Sort the user pool groups in order of preference')
      .sendCarriageReturn() // As is, Admins, Users
      .wait('Do you want to add an admin queries API')
      .sendCarriageReturn() // Yes
      .wait('Do you want to restrict access to the admin queries API')
      .sendYes()
      .wait('Select the group to restrict access with')
      .sendCarriageReturn() // Admins
      .wait('Multifactor authentication (MFA) user login options')
      .sendCarriageReturn() // OFF
      .wait('Email based user registration/forgot password')
      .sendCarriageReturn() // Enabled
      .wait('Specify an email verification subject')
      .sendCarriageReturn() // Your verification code
      .wait('Specify an email verification message')
      .sendCarriageReturn() // Your verification code is {####}
      .wait('Do you want to override the default password policy')
      .sendNo()
      .wait('What attributes are required for signing up')
      .sendCarriageReturn() // Email
      .wait("Specify the app's refresh token expiration period")
      .sendCarriageReturn() // 30
      .wait('Do you want to specify the user attributes this app can read and write')
      .sendNo()
      .wait('Do you want to enable any of the following capabilities')
      .sendCarriageReturn() // None
      .wait('Do you want to use an OAuth flow')
      .sendKeyDown()
      .sendCarriageReturn() // No
      .wait('Do you want to configure Lambda Triggers for Cognito')
      .sendNo()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export const addAuthWithMaxOptions = async (cwd: string, settings: any): Promise<void> => {
  const {
    FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET,
    GOOGLE_APP_ID,
    GOOGLE_APP_SECRET,
    AMAZON_APP_ID,
    AMAZON_APP_SECRET,
    APPLE_APP_ID,
    APPLE_TEAM_ID,
    APPLE_KEY_ID,
    APPLE_PRIVATE_KEY,
  } = getSocialProviders(true);

  const chain = spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
    .wait('Do you want to use the default authentication and security configuration?')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Select the authentication/authorization services that you want to use')
    .sendCarriageReturn()
    .wait('Provide a friendly name for your resource that will be used')
    .sendCarriageReturn()
    .wait('Enter a name for your identity pool')
    .sendCarriageReturn()
    .wait('Allow unauthenticated logins')
    .sendCarriageReturn()
    .wait('Do you want to enable 3rd party authentication providers')
    .sendCarriageReturn()
    .wait('Select the third party identity providers you want to')
    .sendCtrlA()
    .sendCarriageReturn()
    .wait('Enter your Facebook App ID for your identity pool')
    .send('fbIDPOOL')
    .sendCarriageReturn()
    .wait('Enter your Google Web Client ID for your identity pool:')
    .send('googleIDPOOL')
    .sendCarriageReturn();
  if (settings.frontend === 'ios') {
    chain
      .wait('Enter your Google iOS Client ID for your identity pool')
      .send('googleiosclientId')
      .sendCarriageReturn();
  }
  if (settings.frontend === 'android') {
    chain
      .wait('Enter your Google Android Client ID for your identity pool')
      .send('googleandroidclientid')
      .sendCarriageReturn();
  }
  chain
    .wait('Enter your Amazon App ID for your identity pool')
    .send('amazonIDPOOL')
    .sendCarriageReturn()
    .wait('Enter your Bundle Identifier for your identity pool')
    .send('appleIDPOOL')
    .sendCarriageReturn()
    .wait('Provide a name for your user pool')
    .sendCarriageReturn()
    .wait('How do you want users to be able to sign in')
    .sendCarriageReturn()
    .wait('Do you want to add User Pool Groups?')
    .sendCarriageReturn()
    .wait('Provide a name for your user pool group')
    .send('userPoolGroup1')
    .sendCarriageReturn()
    .wait('Do you want to add another User Pool Group')
    .send('y')
    .sendCarriageReturn()
    .wait('Provide a name for your user pool group')
    .send('userPoolGroup2')
    .sendCarriageReturn()
    .wait('Do you want to add another User Pool Group')
    .sendCarriageReturn()
    .wait('Sort the user pool groups in order of preference')
    .sendCarriageReturn()
    .wait('Do you want to add an admin queries API?')
    .sendCarriageReturn()
    .wait('Do you want to restrict access to the admin queries API')
    .sendCarriageReturn()
    .wait('Select the group to restrict access with')
    .sendCarriageReturn()
    .wait('Multifactor authentication (MFA) user login options')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('For user login, select the MFA types')
    .sendCtrlA()
    .sendCarriageReturn()
    .wait('Specify an SMS authentication message')
    .sendCarriageReturn()
    .wait('Email based user registration/forgot password')
    .sendCarriageReturn()
    .wait('Specify an email verification subject')
    .sendCarriageReturn()
    .wait('Specify an email verification message')
    .sendCarriageReturn()
    .wait('Do you want to override the default password policy')
    .sendYes()
    .wait('Enter the minimum password length for this User Pool')
    .sendCarriageReturn()
    .wait('Select the password character requirements for your userpool')
    .sendCtrlA()
    .sendCarriageReturn()
    .wait('What attributes are required for signing up?')
    .sendCarriageReturn()
    .wait('Specify the app')
    .sendCarriageReturn()
    .wait('Do you want to specify the user attributes this app')
    .sendYes()
    .wait('Specify read attributes')
    .sendCarriageReturn()
    .wait('Specify write attributes')
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .sendCarriageReturn()
    .wait('Do you want to use an OAuth flow')
    .sendCarriageReturn()
    .wait('What domain name prefix do you want to use?')
    .sendCarriageReturn()
    .wait('Enter your redirect signin URI')
    .sendLine('https://signin1/')
    .wait('Do you want to add another redirect signin URI')
    .sendNo()
    .wait('Enter your redirect signout URI')
    .sendLine('https://signout1/')
    .wait('Do you want to add another redirect signout URI')
    .sendNo();
  if (settings.frontend !== 'ios' && settings.frontend !== 'android' && settings.frontend !== 'flutter') {
    chain.wait('Select the OAuth flows enabled for this project').sendCarriageReturn();
  }
  return chain
    .wait('Select the OAuth scopes enabled for this project')
    .sendCarriageReturn()
    .wait('Select the social providers you want to configure for your user pool')
    .sendCtrlA()
    .sendCarriageReturn()
    .wait('Enter your Facebook App ID for your OAuth flow')
    .sendLine(FACEBOOK_APP_ID)
    .wait('Enter your Facebook App Secret for your OAuth flow')
    .sendLine(FACEBOOK_APP_SECRET)
    .wait('Enter your Google Web Client ID for your OAuth flow')
    .sendLine(GOOGLE_APP_ID)
    .wait('Enter your Google Web Client Secret for your OAuth flow')
    .sendLine(GOOGLE_APP_SECRET)
    .wait('Enter your Amazon App ID for your OAuth flow')
    .sendLine(AMAZON_APP_ID)
    .wait('Enter your Amazon App Secret for your OAuth flow')
    .sendLine(AMAZON_APP_SECRET)
    .wait('Enter your Services ID for your OAuth flow')
    .sendLine(APPLE_APP_ID)
    .wait('Enter your Team ID for your OAuth flow')
    .sendLine(APPLE_TEAM_ID)
    .wait('Enter your Key ID for your OAuth flow')
    .sendLine(APPLE_KEY_ID)
    .wait('Enter your Private Key for your OAuth flow')
    .sendLine(APPLE_PRIVATE_KEY)
    .wait('Do you want to configure Lambda Triggers for Cognito')
    .sendYes()
    .wait('Which triggers do you want to enable for Cognito')
    .sendCtrlA()
    .send(' ')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Create Auth Challenge')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(' ')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Custom Message')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(' ')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Define Auth Challenge')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(' ')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Post Authentication')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Post Confirmation')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Pre Authentication')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Pre Sign-up')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Verify')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Pre Token')
    .sendCarriageReturn()
    .wait('Do you want to edit your custom function now')
    .sendNo()
    .wait('Successfully')
    .wait('Do you want to edit your custom function now')
    .sendNo()
    .wait('Successfully')
    .wait('Do you want to edit your custom function now')
    .sendNo()
    .wait('Successfully')
    .runAsync();
};

//add default auth with pre token generation trigger
export function addAuthWithPreTokenGenerationTrigger(projectDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd: projectDir, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration')
      .sendCarriageReturn()
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn()
      .wait('Do you want to configure advanced settings')
      .sendLine(KEY_DOWN_ARROW)
      .wait('What attributes are required for signing up?')
      .sendCarriageReturn()
      .wait('Do you want to enable any of the following capabilities')
      .send(KEY_UP_ARROW) //Override ID Token Claims
      .sendLine(' ')
      .wait('Successfully added the Lambda function locally')
      .wait('Do you want to edit your alter-claims function now')
      .sendLine('n')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export const updateAuthAddUserGroups = async (projectDir: string, groupNames: string[], settings?: any): Promise<void> => {
  if (groupNames.length == 0) {
    return undefined;
  }
  const testingWithLatestCodebase = settings && settings.testingWithLatestCodebase ? settings.testingWithLatestCodebase : false;

  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'auth'], { cwd: projectDir, stripColors: true });
  if (settings?.overrides?.category === 'auth') {
    chain.wait('A migration is needed to support latest updates on auth resources').sendYes();
  }
  chain
    .wait('What do you want to do?')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Provide a name for your user pool group')
    .send(groupNames[0])
    .sendCarriageReturn();

  if (groupNames.length > 1) {
    let index = 1;
    while (index < groupNames.length) {
      chain
        .wait('Do you want to add another User Pool Group')
        .sendYes()
        .wait('Provide a name for your user pool group')
        .send(groupNames[index++])
        .sendCarriageReturn();
    }
  }

  chain
    .wait('Do you want to add another User Pool Group')
    .sendCarriageReturn()
    .wait('Sort the user pool groups in order of preference')
    .sendCarriageReturn()
    .wait('"amplify publish" will build all your local backend and frontend resources');

  return chain.runAsync();
};

export function addAuthUserPoolOnlyWithOAuth(cwd: string, settings: AddAuthUserPoolOnlyWithOAuthSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration?')
      .sendKeyDown(2)
      .sendCarriageReturn()
      .wait('Select the authentication/authorization services that you want to use')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource that will be used')
      .sendLine(settings.resourceName)
      .wait('Provide a name for your user pool')
      .sendLine(settings.userPoolName)
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn() // Username
      .wait('Do you want to add User Pool Groups?')
      .sendKeyDown() // No
      .sendCarriageReturn()
      .wait('Do you want to add an admin queries API?')
      .sendKeyDown() // No
      .sendCarriageReturn()
      .wait('Multifactor authentication (MFA) user login options')
      .sendCarriageReturn() // OFF
      .wait('Email based user registration/forgot password')
      .sendCarriageReturn() // Enabled
      .wait('Specify an email verification subject')
      .sendCarriageReturn()
      .wait('Specify an email verification message')
      .sendCarriageReturn()
      .wait('Do you want to override the default password policy')
      .sendNo()
      .wait('What attributes are required for signing up?')
      .sendCarriageReturn()
      .wait("Specify the app's refresh token expiration period (in days)")
      .sendCarriageReturn()
      .wait('Do you want to specify the user attributes this app can read and write')
      .sendNo()
      .wait('Do you want to enable any of the following capabilities?')
      .sendCarriageReturn()
      .wait('Do you want to use an OAuth flow')
      .sendCarriageReturn() // Yes
      .wait('What domain name prefix do you want to use?')
      .sendLine(settings.domainPrefix)
      .wait('Enter your redirect signin URI')
      .sendLine(settings.signInUrl1)
      .wait('Do you want to add another redirect signin URI')
      .sendYes()
      .wait('Enter your redirect signin URI')
      .sendLine(settings.signInUrl2)
      .wait('Do you want to add another redirect signin URI')
      .sendNo()
      .wait('Enter your redirect signout URI')
      .sendLine(settings.signOutUrl1)
      .wait('Do you want to add another redirect signout URI')
      .sendYes()
      .wait('Enter your redirect signout URI')
      .sendLine(settings.signOutUrl2)
      .wait('Do you want to add another redirect signout URI')
      .sendNo()
      .wait('Select the OAuth flows enabled for this project')
      .sendCarriageReturn() // Authorization Grant
      .wait('Select the OAuth scopes enabled for this project')
      .sendCarriageReturn() // All
      .wait('Select the social providers you want to configure for your user pool')
      .sendLine('a') // Select all
      .wait('Enter your Facebook App ID for your OAuth flow')
      .sendLine(settings.facebookAppId)
      .wait('Enter your Facebook App Secret for your OAuth flow')
      .sendLine(settings.facebookAppSecret)
      .wait('Enter your Google Web Client ID for your OAuth flow')
      .sendLine(settings.googleAppId)
      .wait('Enter your Google Web Client Secret for your OAuth flow')
      .sendLine(settings.googleAppSecret)
      .wait('Enter your Amazon App ID for your OAuth flow')
      .sendLine(settings.amazonAppId)
      .wait('Enter your Amazon App Secret for your OAuth flow')
      .sendLine(settings.amazonAppSecret)
      .wait('Enter your Services ID for your OAuth flow:')
      .sendLine(settings.appleAppClientId)
      .wait('Enter your Team ID for your OAuth flow:')
      .sendLine(settings.appleAppTeamId)
      .wait('Enter your Key ID for your OAuth flow:')
      .sendLine(settings.appleAppKeyID)
      .wait('Enter your Private Key for your OAuth flow:')
      .sendLine(settings.appleAppPrivateKey)
      .wait('Do you want to configure Lambda Triggers for Cognito')
      .sendNo()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export const addAuthIdentityPoolAndUserPoolWithOAuth = async (
  cwd: string,
  settings: AddAuthIdentityPoolAndUserPoolWithOAuthSettings,
): Promise<void> => {
  const chain = spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
    .wait('Do you want to use the default authentication and security configuration?')
    .sendKeyDown(2)
    .sendCarriageReturn()
    .wait('Select the authentication/authorization services that you want to use')
    .sendCarriageReturn()
    .wait('Provide a friendly name for your resource that will be used')
    .sendLine(settings.resourceName)
    .wait('Enter a name for your identity pool')
    .sendLine(settings.identityPoolName)
    .wait('Allow unauthenticated logins');

  if (settings.allowUnauthenticatedIdentities) {
    chain.sendKeyUp().sendCarriageReturn();
  } else {
    chain.sendNo();
  }

  return chain
    .wait('Do you want to enable 3rd party authentication providers')
    .sendYes()
    .wait('Select the third party identity providers you want to')
    .sendCtrlA()
    .sendCarriageReturn()
    .wait('Enter your Facebook App ID for your identity pool')
    .sendLine(settings.idpFacebookAppId)
    .wait('Enter your Google Web Client ID for your identity pool:')
    .sendLine(settings.idpGoogleAppId)
    .wait('Enter your Amazon App ID for your identity pool')
    .sendLine(settings.idpAmazonAppId)
    .wait('Enter your Bundle Identifier for your identity pool')
    .sendLine(settings.idpAppleAppId)
    .wait('Provide a name for your user pool')
    .sendLine(settings.userPoolName)
    .wait('How do you want users to be able to sign in')
    .sendCarriageReturn() // Username
    .wait('Do you want to add User Pool Groups?')
    .sendKeyDown() // No
    .sendCarriageReturn()
    .wait('Do you want to add an admin queries API?')
    .sendKeyDown() // No
    .sendCarriageReturn()
    .wait('Multifactor authentication (MFA) user login options')
    .sendCarriageReturn() // OFF
    .wait('Email based user registration/forgot password')
    .sendCarriageReturn() // Enabled
    .wait('Specify an email verification subject')
    .sendCarriageReturn()
    .wait('Specify an email verification message')
    .sendCarriageReturn()
    .wait('Do you want to override the default password policy')
    .sendNo()
    .wait('What attributes are required for signing up?')
    .sendCarriageReturn()
    .wait("Specify the app's refresh token expiration period (in days)")
    .sendCarriageReturn()
    .wait('Do you want to specify the user attributes this app can read and write')
    .sendNo()
    .wait('Do you want to enable any of the following capabilities?')
    .sendCarriageReturn()
    .wait('Do you want to use an OAuth flow')
    .sendCarriageReturn() // Yes
    .wait('What domain name prefix do you want to use?')
    .sendLine(settings.domainPrefix)
    .wait('Enter your redirect signin URI')
    .sendLine(settings.signInUrl1)
    .wait('Do you want to add another redirect signin URI')
    .sendYes()
    .wait('Enter your redirect signin URI')
    .sendLine(settings.signInUrl2)
    .wait('Do you want to add another redirect signin URI')
    .sendNo()
    .wait('Enter your redirect signout URI')
    .sendLine(settings.signOutUrl1)
    .wait('Do you want to add another redirect signout URI')
    .sendYes()
    .wait('Enter your redirect signout URI')
    .sendLine(settings.signOutUrl2)
    .wait('Do you want to add another redirect signout URI')
    .sendNo()
    .wait('Select the OAuth flows enabled for this project')
    .sendCarriageReturn() // Authorization Grant
    .wait('Select the OAuth scopes enabled for this project')
    .sendCarriageReturn() // All
    .wait('Select the social providers you want to configure for your user pool')
    .sendLine('a') // Select all
    .wait('Enter your Facebook App ID for your OAuth flow')
    .sendLine(settings.facebookAppId)
    .wait('Enter your Facebook App Secret for your OAuth flow')
    .sendLine(settings.facebookAppSecret)
    .wait('Enter your Google Web Client ID for your OAuth flow')
    .sendLine(settings.googleAppId)
    .wait('Enter your Google Web Client Secret for your OAuth flow')
    .sendLine(settings.googleAppSecret)
    .wait('Enter your Amazon App ID for your OAuth flow')
    .sendLine(settings.amazonAppId)
    .wait('Enter your Amazon App Secret for your OAuth flow')
    .sendLine(settings.amazonAppSecret)
    .wait('Enter your Services ID for your OAuth flow:')
    .sendLine(settings.appleAppClientId)
    .wait('Enter your Team ID for your OAuth flow:')
    .sendLine(settings.appleAppTeamId)
    .wait('Enter your Key ID for your OAuth flow:')
    .sendLine(settings.appleAppKeyID)
    .wait('Enter your Private Key for your OAuth flow:')
    .sendLine(settings.appleAppPrivateKey)
    .wait('Do you want to configure Lambda Triggers for Cognito')
    .sendNo()
    .sendEof()
    .runAsync();
};

export function addAuthUserPoolOnlyNoOAuth(cwd: string, settings: AddAuthUserPoolOnlyNoOAuthSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration?')
      .sendKeyDown(2)
      .sendCarriageReturn()
      .wait('Select the authentication/authorization services that you want to use')
      .sendKeyDown()
      .sendCarriageReturn()
      .wait('Provide a friendly name for your resource that will be used')
      .sendLine(settings.resourceName)
      .wait('Provide a name for your user pool')
      .sendLine(settings.userPoolName)
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn() // Username
      .wait('Do you want to add User Pool Groups?')
      .sendKeyDown() // No
      .sendCarriageReturn()
      .wait('Do you want to add an admin queries API?')
      .sendKeyDown() // No
      .sendCarriageReturn()
      .wait('Multifactor authentication (MFA) user login options')
      .sendCarriageReturn() // OFF
      .wait('Email based user registration/forgot password')
      .sendCarriageReturn() // Enabled
      .wait('Specify an email verification subject')
      .sendCarriageReturn()
      .wait('Specify an email verification message')
      .sendCarriageReturn()
      .wait('Do you want to override the default password policy')
      .sendNo()
      .wait('What attributes are required for signing up?')
      .sendCarriageReturn()
      .wait("Specify the app's refresh token expiration period (in days)")
      .sendCarriageReturn()
      .wait('Do you want to specify the user attributes this app can read and write')
      .sendNo()
      .wait('Do you want to enable any of the following capabilities?')
      .sendCarriageReturn()
      .wait('Do you want to use an OAuth flow')
      .sendKeyDown() // No
      .sendCarriageReturn()
      .wait('Do you want to configure Lambda Triggers for Cognito')
      .sendNo()
      .sendEof()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export const updateAuthAddAdminQueries = async (projectDir: string, groupName = 'adminQueriesGroup', settings: any = {}): Promise<void> => {
  const testingWithLatestCodebase = settings.testingWithLatestCodebase ?? false;

  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'auth'], { cwd: projectDir, stripColors: true });
  if (settings?.overrides?.category === 'auth') {
    chain.wait('A migration is needed to support latest updates on auth resources').sendYes();
  }
  return chain
    .wait('What do you want to do?')
    .sendKeyUp()
    .sendCarriageReturn() // Create or update Admin queries API
    .wait('Do you want to restrict access to the admin queries API to a specific Group')
    .sendYes()
    .wait('Select the group to restrict access with')
    .sendCarriageReturn() // Enter a custom group
    .wait('Provide a group name')
    .send(groupName)
    .sendCarriageReturn()
    .sendEof()
    .runAsync();
};

export const updateAuthWithoutTrigger = (cwd: string, settings: any): Promise<void> => {
  const testingWithLatestCodebase = settings.testingWithLatestCodebase ?? false;

  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['update', 'auth'], { cwd, stripColors: true });
  if (settings?.overrides?.category === 'auth') {
    chain.wait('A migration is needed to support latest updates on auth resources').sendYes();
  }
  return chain
    .wait('What do you want to do?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Select the authentication/authorization services that you want to use:')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to add User Pool Groups?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to add an admin queries API?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Multifactor authentication (MFA) user login options:')
    .sendCarriageReturn()
    .wait('Email based user registration/forgot password:')
    .sendCarriageReturn()
    .wait('Specify an email verification subject:')
    .sendCarriageReturn()
    .wait('Specify an email verification message:')
    .sendCarriageReturn()
    .wait('Do you want to override the default password policy for this User Pool?')
    .sendCarriageReturn()
    .wait("Specify the app's refresh token expiration period (in days):")
    .sendCarriageReturn()
    .wait('Do you want to specify the user attributes this app can read and write?')
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .sendCarriageReturn()
    .wait('Do you want to use an OAuth flow?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to configure Lambda Triggers for Cognito?')
    .sendNo()
    .runAsync();
};

export function updateAuthAdminQueriesWithExtMigration(cwd: string, settings: { testingWithLatestCodebase: boolean }): Promise<void> {
  return spawn(getCLIPath(settings.testingWithLatestCodebase), ['update', 'auth'], { cwd, stripColors: true })
    .wait('Do you want to migrate auth resource')
    .sendYes()
    .wait('What do you want to do')
    .sendKeyUp()
    .sendCarriageReturn() // Create or update Admin queries API
    .wait('Do you want to restrict access to the admin queries API to a specific Group')
    .sendYes()
    .sendCarriageReturn()
    .wait('Select the group to restrict access with')
    .sendCarriageReturn() // Enter a custom group
    .wait('Provide a group name')
    .sendLine('mycustomgroup')
    .wait('A migration is needed to support latest updates')
    .sendYes()
    .runAsync();
}

export function updateAuthMFAConfiguration(projectDir: string, settings: any = {}): Promise<void> {
  return spawn(getCLIPath(settings.testingWithLatestCodebase), ['update', 'auth'], { cwd: projectDir, stripColors: true })
    .wait('What do you want to do?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn() // Walkthrough all the auth configurations
    .wait('Select the authentication/authorization services that you want to use')
    .sendCarriageReturn() // User Sign-Up, Sign-In, connected with AWS IAM controls (Enables per-user Storage features for images or other content, Analytics, and more)
    .wait('Allow unauthenticated logins? (Provides scoped down permissions that you can control via AWS IAM)')
    .sendCarriageReturn() // No
    .wait('Do you want to enable 3rd party authentication providers in your identity pool?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn() // No
    .wait('Do you want to add User Pool Groups?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn() // No
    .wait('Do you want to add an admin queries API?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn() // No
    .wait('Multifactor authentication (MFA) user login options')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn() // OPTIONAL (Individual users can use MFA)
    .wait('For user login, select the MFA types')
    .sendCtrlA()
    .sendCarriageReturn()
    .wait('Specify an SMS authentication message:')
    .sendCarriageReturn() //  (Your authentication code is {####})
    .wait('Email based user registration/forgot password')
    .sendCarriageReturn() // Enabled (Requires per-user email entry at registration)
    .wait('Specify an email verification subject')
    .sendCarriageReturn() // (Your verification code)
    .wait('Specify an email verification message:')
    .sendCarriageReturn() // (Your verification code is {####})
    .wait('Do you want to override the default password policy for this User Pool?')
    .sendNo()
    .sendCarriageReturn()
    .wait(`Specify the app's refresh token expiration period (in days)`)
    .sendCarriageReturn() // 30
    .wait('Do you want to specify the user attributes this app can read and write?')
    .sendNo()
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .sendCarriageReturn()
    .wait('Do you want to use an OAuth flow?')
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Do you want to configure Lambda Triggers for Cognito?')
    .sendNo()
    .runAsync();
}

export function updateAuthWithGroupTrigger(cwd: string, settings: any): Promise<void> {
  return spawn(getCLIPath(), ['update', 'auth'], { cwd, stripColors: true })
    .wait('What do you want to do?')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .sendCarriageReturn()
    .wait('Select the authentication/authorization services that you want to use:')
    .sendCarriageReturn()
    .wait('Allow unauthenticated logins?')
    .sendCarriageReturn()
    .wait('Do you want to enable 3rd party authentication providers in your identity pool?')
    .sendCarriageReturn()
    .wait('Do you want to add User Pool Groups?')
    .sendCarriageReturn()
    .wait('Do you want to add an admin queries API?')
    .sendCarriageReturn()
    .wait('Multifactor authentication (MFA) user login options:')
    .sendCarriageReturn()
    .wait('Email based user registration/forgot password:')
    .sendCarriageReturn()
    .wait('Please specify an email verification subject:')
    .sendCarriageReturn()
    .wait('Please specify an email verification message:')
    .sendCarriageReturn()
    .wait('Do you want to override the default password policy for this User Pool?')
    .sendCarriageReturn()
    .wait("Specify the app's refresh token expiration period (in days):")
    .sendCarriageReturn()
    .wait('Do you want to specify the user attributes this app can read and write?')
    .sendCarriageReturn()
    .wait('Do you want to enable any of the following capabilities?')
    .sendCarriageReturn()
    .wait('Do you want to use an OAuth flow?')
    .sendCarriageReturn()
    .wait('Do you want to configure Lambda Triggers for Cognito?')
    .sendCarriageReturn()
    .wait('Which triggers do you want to enable for Cognito')
    .sendCarriageReturn()
    .wait('What functionality do you want to use for Pre Sign-up')
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(KEY_DOWN_ARROW)
    .send(' ')
    .sendCarriageReturn()
    .runAsync();
}
