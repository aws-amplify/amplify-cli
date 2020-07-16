import { KEY_UP_ARROW } from '../utils';
import { nspawn as spawn, KEY_DOWN_ARROW, getCLIPath, getSocialProviders } from '../../src';

export function addAuthWithDefault(cwd: string, settings: any = {}) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication')
      .sendCarriageReturn()
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn()
      .wait('Do you want to configure advanced settings?')
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

export function removeAuthWithDefault(cwd: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['remove', 'auth'], { cwd, stripColors: true })
      .wait('Choose the resource you would want to remove')
      .sendCarriageReturn()
      .wait('Are you sure you want to delete the resource? This')
      .sendLine('y')
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

export function addAuthWithGroupTrigger(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
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
      .send('mygroup')
      .sendCarriageReturn()
      .wait('Do you want to edit your add-to-group function now?')
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

export function addAuthViaAPIWithTrigger(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'api'], { cwd, stripColors: true })
      .wait('Please select from one of the below mentioned services:')
      .sendCarriageReturn()
      .wait('Provide API name')
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
      .send('mygroup')
      .sendCarriageReturn()
      .wait('Do you want to edit your add-to-group function now?')
      .sendLine('n')
      .wait(/.*Do you want to configure advanced settings for the GraphQL API.*/)
      .sendCarriageReturn()
      .wait('Do you have an annotated GraphQL schema?')
      .sendLine('n')
      .wait('Do you want a guided schema creation?')
      .send('y')
      .sendCarriageReturn()
      .wait('What best describes your project:')
      .sendCarriageReturn()
      .wait('Do you want to edit the schema now?')
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

export function addAuthWithCustomTrigger(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration?')
      .send(KEY_DOWN_ARROW)
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Select the authentication/authorization services that you want to use:')
      .sendCarriageReturn()
      .wait('Please provide a friendly name')
      .sendCarriageReturn()
      .wait('Please enter a name for your identity pool.')
      .sendCarriageReturn()
      .wait('Allow unauthenticated logins?')
      .sendCarriageReturn()
      .wait('Do you want to enable 3rd party authentication providers in your identity pool?')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Please provide a name for your user pool:')
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
      .wait('Please specify an email verification subject:')
      .sendCarriageReturn()
      .wait('Please specify an email verification message:')
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
      .send('amazon.com')
      .sendCarriageReturn()
      .wait('Do you want to edit your email-filter-blacklist function now?')
      .sendLine('n')
      .wait('Do you want to edit your custom function now?')
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

export function updateAuthSignInSignOutUrl(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'auth'], { cwd, stripColors: true })
      .wait('What do you want to do?')
      .send(KEY_DOWN_ARROW)
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Which redirect signin URIs do you want to edit?')
      .send(' ')
      .sendCarriageReturn()
      .wait(`Update ${settings.signinUrl}`)
      .send(settings.updatesigninUrl)
      .sendCarriageReturn()
      .wait('Do you want to add redirect signin URIs?')
      .sendLine('n')
      .wait('Which redirect signout URIs do you want to edit?')
      .send(' ')
      .sendCarriageReturn()
      .wait(`Update ${settings.signoutUrl}`)
      .send(settings.updatesignoutUrl)
      .sendCarriageReturn()
      .wait('Do you want to add redirect signout URIs?')
      .sendLine('n')
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

export function updateAuthWithoutCustomTrigger(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'auth'], { cwd, stripColors: true })
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
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addAuthWithRecaptchaTrigger(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
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
      .sendLine('n')
      .wait('Do you want to edit your captcha-create-challenge function now?')
      .sendLine('n')
      .wait('Enter the Google reCaptcha secret key:')
      .send('dummykey')
      .sendCarriageReturn()
      .wait('Do you want to edit your captcha-verify function now?')
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

export function updateAuthRemoveRecaptchaTrigger(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['update', 'auth'], { cwd, stripColors: true })
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
      .wait('Please specify an email verification subject:')
      .sendCarriageReturn()
      .wait('Please specify an email verification message')
      .sendCarriageReturn()
      .wait('Do you want to override the default password policy for this')
      .sendCarriageReturn()
      .wait('Specify the app')
      .sendCarriageReturn()
      .wait('Do you want to specify the user attributes')
      .sendCarriageReturn()
      .wait('Do you want to enable any of the following capabilities')
      .send('a')
      .send('a')
      .sendCarriageReturn()
      .wait('Do you want to use an OAuth')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Do you want to configure Lambda Triggers for Cognito')
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

export function addAuthWithSignInSignOutUrl(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
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
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Enter your redirect signout URI:')
      .sendLine(settings.signoutUrl)
      .sendCarriageReturn()
      .wait('Do you want to add another redirect signout URI')
      .sendLine('n')
      .sendCarriageReturn()
      .wait('Select the social providers you want to configure for your user pool:')
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

export function addAuthWithDefaultSocial(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    const {
      FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET,
      GOOGLE_APP_ID,
      GOOGLE_APP_SECRET,
      AMAZON_APP_ID,
      AMAZON_APP_SECRET,
    }: any = getSocialProviders(true);

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
      .sendLine('n')
      .wait('Enter your redirect signout URI:')
      .sendLine('https://www.nytimes.com/')
      .wait('Do you want to add another redirect signout URI')
      .sendLine('n')
      .wait('Select the social providers you want to configure for your user pool:')
      .send('a')
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

export function addAuthUserPoolOnly(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration?')
      .send(KEY_DOWN_ARROW)
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Select the authentication/authorization services that you want to use')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Please provide a friendly name for your resource that will be used')
      .sendCarriageReturn()
      .wait('Please provide a name for your user pool')
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
      .send('a')
      .sendCarriageReturn()
      .wait('Please specify an SMS authentication message')
      .sendCarriageReturn()
      .wait('Email based user registration/forgot password')
      .sendCarriageReturn()
      .wait('Please specify an email verification subject')
      .sendCarriageReturn()
      .wait('Please specify an email verification message')
      .sendCarriageReturn()
      .wait('Do you want to override the default password policy')
      .send('y')
      .sendCarriageReturn()
      .wait('Enter the minimum password length for this User Pool')
      .sendCarriageReturn()
      .wait('Select the password character requirements for your userpool')
      .send('a')
      .sendCarriageReturn()
      .wait('What attributes are required for signing up?')
      .sendCarriageReturn()
      .wait('Specify the app')
      .sendCarriageReturn()
      .wait('Do you want to specify the user attributes this app')
      .send('y')
      .sendCarriageReturn()
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
      .send('https://signin1/')
      .sendCarriageReturn()
      .wait('Do you want to add another redirect signin URI')
      .sendLine('n')
      .wait('Enter your redirect signout URI')
      .send('https://signout1/')
      .sendCarriageReturn()
      .wait('Do you want to add another redirect signout URI')
      .sendLine('n')
      .wait('Select the OAuth flows enabled for this project')
      .sendCarriageReturn()
      .wait('Select the OAuth scopes enabled for this project')
      .sendCarriageReturn()
      .wait('Select the social providers you want to configure for your user pool')
      .send('a')
      .sendCarriageReturn()
      .wait('Enter your Facebook App ID for your OAuth flow')
      .send('fbOAUTHid')
      .sendCarriageReturn()
      .wait('Enter your Facebook App Secret for your OAuth flow')
      .send('fbOAUTHsecret')
      .sendCarriageReturn()
      .wait('Enter your Google Web Client ID for your OAuth flow')
      .send('googOAUTHid')
      .sendCarriageReturn()
      .wait('Enter your Google Web Client Secret for your OAuth flow')
      .send('googOAUTHsecret')
      .sendCarriageReturn()
      .wait('Enter your Amazon App ID for your OAuth flow')
      .send('amzOAUTHid')
      .sendCarriageReturn()
      .wait('Enter your Amazon App Secret for your OAuth flow')
      .send('amzOAUTHsecret')
      .sendCarriageReturn()
      .wait('Do you want to configure Lambda Triggers for Cognito')
      .send('y')
      .sendCarriageReturn()
      .wait('Which triggers do you want to enable for Cognito')
      .send('a')
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
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .send('n')
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

export function addAuthWithGroupsAndAdminAPI(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration')
      .send(KEY_DOWN_ARROW)
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // Manual configuration
      .wait('Select the authentication/authorization services that you want to use')
      .sendCarriageReturn() // for sign-up/-in and IAM controls
      .wait('Please provide a friendly name for your resource that will be used')
      .sendCarriageReturn() // Default
      .wait('Please enter a name for your identity pool')
      .sendCarriageReturn() // Default
      .wait('Allow unauthenticated logins')
      .sendCarriageReturn() // No
      .wait('Do you want to enable 3rd party authentication providers')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // No
      .wait('Please provide a name for your user pool')
      .sendCarriageReturn() // Default
      .wait('Warning: you will not be able to edit these selections')
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn() // Username
      .wait('Do you want to add User Pool Groups')
      .sendCarriageReturn() // Yes
      .wait('Provide a name for your user pool group')
      .sendLine('Admins')
      .wait('Do you want to add another User Pool Group')
      .sendLine('y')
      .wait('Provide a name for your user pool group')
      .sendLine('Users')
      .wait('Do you want to add another User Pool Group')
      .sendLine('n')
      .wait('Sort the user pool groups in order of preference')
      .sendCarriageReturn() // As is, Admins, Users
      .wait('Do you want to add an admin queries API')
      .sendCarriageReturn() // Yes
      .wait('Do you want to restrict access to the admin queries API')
      .sendLine('y')
      .wait('Select the group to restrict access with')
      .sendCarriageReturn() // Admins
      .wait('Multifactor authentication (MFA) user login options')
      .sendCarriageReturn() // OFF
      .wait('Email based user registration/forgot password')
      .sendCarriageReturn() // Enabled
      .wait('Please specify an email verification subject')
      .sendCarriageReturn() // Your verification code
      .wait('Please specify an email verification message')
      .sendCarriageReturn() // Your verification code is {####}
      .wait('Do you want to override the default password policy')
      .sendLine('n')
      .wait('What attributes are required for signing up')
      .sendCarriageReturn() // Email
      .wait("Specify the app's refresh token expiration period")
      .sendCarriageReturn() // 30
      .wait('Do you want to specify the user attributes this app can read and write')
      .sendLine('n')
      .wait('Do you want to enable any of the following capabilities')
      .sendCarriageReturn() // None
      .wait('Do you want to use an OAuth flow')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn() // No
      .wait('Do you want to configure Lambda Triggers for Cognito')
      .sendLine('n')
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

export function addAuthWithMaxOptions(cwd: string, settings: any) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration?')
      .send(KEY_DOWN_ARROW)
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('Select the authentication/authorization services that you want to use')
      .sendCarriageReturn()
      .wait('Please provide a friendly name for your resource that will be used')
      .sendCarriageReturn()
      .wait('Please enter a name for your identity pool')
      .sendCarriageReturn()
      .wait('Allow unauthenticated logins')
      .sendCarriageReturn()
      .wait('Do you want to enable 3rd party authentication providers')
      .sendCarriageReturn()
      .wait('Select the third party identity providers you want to')
      .send('a')
      .sendCarriageReturn()
      .wait('Enter your Facebook App ID for your identity pool')
      .send('fbIDPOOL')
      .sendCarriageReturn()
      .wait('Enter your Google Web Client ID for your identity pool:')
      .send('googleIDPOOL')
      .sendCarriageReturn()
      .wait('Enter your Amazon App ID for your identity pool')
      .send('amazonIDPOOL')
      .sendCarriageReturn()
      .wait('Please provide a name for your user pool')
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
      .send('a')
      .sendCarriageReturn()
      .wait('Please specify an SMS authentication message')
      .sendCarriageReturn()
      .wait('Email based user registration/forgot password')
      .sendCarriageReturn()
      .wait('Please specify an email verification subject')
      .sendCarriageReturn()
      .wait('Please specify an email verification message')
      .sendCarriageReturn()
      .wait('Do you want to override the default password policy')
      .sendLine('y')
      .wait('Enter the minimum password length for this User Pool')
      .sendCarriageReturn()
      .wait('Select the password character requirements for your userpool')
      .send('a')
      .sendCarriageReturn()
      .wait('What attributes are required for signing up?')
      .sendCarriageReturn()
      .wait('Specify the app')
      .sendCarriageReturn()
      .wait('Do you want to specify the user attributes this app')
      .sendLine('y')
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
      .sendLine('n')
      .wait('Enter your redirect signout URI')
      .sendLine('https://signout1/')
      .wait('Do you want to add another redirect signout URI')
      .sendLine('n')
      .wait('Select the OAuth flows enabled for this project')
      .sendCarriageReturn()
      .wait('Select the OAuth scopes enabled for this project')
      .sendCarriageReturn()
      .wait('Select the social providers you want to configure for your user pool')
      .send('a')
      .sendCarriageReturn()
      .wait('Enter your Facebook App ID for your OAuth flow')
      .sendLine('fbOAUTHid')
      .wait('Enter your Facebook App Secret for your OAuth flow')
      .sendLine('fbOAUTHsecret')
      .wait('Enter your Google Web Client ID for your OAuth flow')
      .sendLine('googOAUTHid')
      .wait('Enter your Google Web Client Secret for your OAuth flow')
      .sendLine('googOAUTHsecret')
      .wait('Enter your Amazon App ID for your OAuth flow')
      .sendLine('amzOAUTHid')
      .wait('Enter your Amazon App Secret for your OAuth flow')
      .sendLine('amzOAUTHsecret')
      .wait('Do you want to configure Lambda Triggers for Cognito')
      .sendLine('y')
      .wait('Which triggers do you want to enable for Cognito')
      .send('a')
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
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
      .wait('Do you want to edit your custom function now')
      .sendLine('n')
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

//add default auth with pre token generation trigger
export function addAuthWithPreTokenGenerationTrigger(projectDir: string) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(), ['add', 'auth'], { cwd: projectDir, stripColors: true })
      .wait('Do you want to use the default authentication and security configuration')
      .sendCarriageReturn()
      .wait('How do you want users to be able to sign in')
      .sendCarriageReturn()
      .wait('Do you want to configure advanced settings')
      .send(KEY_DOWN_ARROW)
      .sendCarriageReturn()
      .wait('What attributes are required for signing up?')
      .sendCarriageReturn()
      .wait('Do you want to enable any of the following capabilities')
      .send(KEY_UP_ARROW) //Override ID Token Claims
      .send(' ')
      .sendCarriageReturn()
      .wait('Do you want to edit your alter-claims function now')
      .send('n')
      .sendCarriageReturn()
      .wait('"amplify publish" will build all your local backend and frontend resources')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function updateAuthAddUserGroups(projectDir: string, groupNames: string[]) {
  if (groupNames.length == 0) {
    return;
  }

  return new Promise((resolve, reject) => {
    let chain = spawn(getCLIPath(), ['update', 'auth'], { cwd: projectDir, stripColors: true })
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
          .sendLine('y')
          .wait('Provide a name for your user pool group')
          .send(groupNames[index++]);
      }
    }

    chain
      .wait('Do you want to add another User Pool Group')
      .sendCarriageReturn()
      .wait('Sort the user pool groups in order of preference')
      .sendCarriageReturn()
      .wait('"amplify publish" will build all your local backend and frontend resources');

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}
