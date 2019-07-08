
import * as nexpect from '../utils/nexpect-modified';
import { join } from 'path';
import * as fs from 'fs';

import { getCLIPath, isCI, getEnvVars } from '../utils';


export function addAuthWithDefault(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use the default authentication and security configuration?')
      .sendline('\r')
      .wait('How do you want users to be able to sign in')
      .sendline('\r')
      .wait('Do you want to configure advanced settings?')
      .sendline('\r')
      .sendEof()
      // tslint:disable-next-line
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}

export function addAuthWithGroupTrigger(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI(),
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use the default authentication and security configuration?')
      .send('\r')
      .wait('How do you want users to be able to sign in?')
      .send('\r')
      .wait('Do you want to configure advanced settings?')
      .send('j')
      .send('\r')
      .wait('What attributes are required for signing up?')
      .send('\r')
      .wait('Do you want to enable any of the following capabilities?')
      .send('jjj ')
      .send('\r')
      .wait('Enter the name of the group to which users will be added.')
      .send('mygroup')
      .send('\r')
      .wait('Do you want to edit the local PostConfirmation lambda function now?')
      .send('n')
      .send('\r')
      .wait('Do you want to edit your add-to-group function now?')
      .send('n')
      .send('\r')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}

export function addAuthWithCustomTrigger(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI(),
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use the default authentication and security configuration?')
      .send('j')
      .send('j')
      .send('\r')
      .wait('Select the authentication/authorization services that you want to use:')
      .send('\r')
      .wait('Please provide a friendly name')
      .send('\r')
      .wait('Please enter a name for your identity pool.')
      .send('\r')
      .wait('Allow unauthenticated logins?')
      .send('\r')
      .wait('Do you want to enable 3rd party authentication providers in your identity pool?')
      .send('j')
      .send('\r')
      .wait('Please provide a name for your user pool:')
      .send('\r')
      .wait('How do you want users to be able to sign in?')
      .send('\r')
      .wait('Multifactor authentication (MFA) user login options:')
      .send('\r')
      .wait('Email based user registration/forgot password:')
      .send('\r')
      .wait('Please specify an email verification subject:')
      .send('\r')
      .wait('Please specify an email verification message:')
      .send('\r')
      .wait('Do you want to override the default password policy for this User Pool?')
      .send('\r')
      .wait(' What attributes are required for signing up?')
      .send('\r')
      .wait('Specify the app\'s refresh token expiration period (in days):')
      .send('\r')
      .wait('o you want to specify the user attributes this app can read and write?')
      .send('\r')
      .wait('Do you want to enable any of the following capabilities?')
      .send('jjjj')
      .send(' ')
      .send('\r')
      .wait('Do you want to use an OAuth flow?')
      .send('j')
      .send('\r')
      .wait('Do you want to configure Lambda Triggers for Cognito?')
      .send('\r')
      .wait('Which triggers do you want to enable for Cognito')
      .send('\r')
      .wait('What functionality do you want to use for Pre Sign-up')
      .send('jjj')
      .send(' ')
      .send('\r')
      .wait('Enter a comma-delimited list of disallowed email domains')
      .send('amazon.com')
      .send('\r')
      .wait('Do you want to edit the local PreSignup lambda function now?')
      .send('n')
      .send('\r')
      .wait('Do you want to edit your email-filter-blacklist function now?')
      .send('n')
      .send('\r')
      .wait('Do you want to edit your custom function now?')
      .send('n')
      .send('\r')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}

export function updateAuthWithoutCustomTrigger(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI(),
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['update', 'auth'], { cwd, stripColors: true, verbose })
      .wait('What do you want to do?')
      .send('j')
      .send('j')
      .send('\r')
      .wait('Select the authentication/authorization services that you want to use:')
      .send('\r')
      .wait('Allow unauthenticated logins?')
      .send('\r')
      .wait('Do you want to enable 3rd party authentication providers in your identity pool?')
      .send('\r')
      .wait('Multifactor authentication (MFA) user login options:')
      .send('\r')
      .wait('Email based user registration/forgot password:')
      .send('\r')
      .wait('Please specify an email verification subject:')
      .send('\r')
      .wait('Please specify an email verification message:')
      .send('\r')
      .wait('Do you want to override the default password policy for this User Pool?')
      .send('\r')
      .wait('Specify the app\'s refresh token expiration period (in days):')
      .send('\r')
      .wait('Do you want to specify the user attributes this app can read and write?')
      .send('\r')
      .wait('Do you want to enable any of the following capabilities?')
      .send('\r')
      .wait('Do you want to use an OAuth flow?')
      .send('\r')
      .wait('Do you want to configure Lambda Triggers for Cognito?')
      .send('\r')
      .wait('Which triggers do you want to enable for Cognito')
      .send('\r')
      .wait('What functionality do you want to use for Pre Sign-up')
      .send('jjj')
      .send(' ')
      .send('\r')
      .wait('Do you want to edit the local PreSignup lambda function now?')
      .send('n')
      .send('\r')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}

export function addAuthWithRecaptchaTrigger(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI(),
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use the default authentication and security configuration?')
      .send('\r')
      .wait('How do you want users to be able to sign in?')
      .send('\r')
      .wait('Do you want to configure advanced settings?')
      .send('j')
      .send('\r')
      .wait('What attributes are required for signing up?')
      .send('\r')
      .wait('Do you want to enable any of the following capabilities?')
      .send(' ')
      .send('\r')
      .wait('Do you want to edit the local DefineAuthChallenge lambda function now?')
      .send('n')
      .send('\r')
      .wait('Do you want to edit your captcha-define-challenge function now?')
      .send('n')
      .send('\r')
      .wait('Do you want to edit the local CreateAuthChallenge lambda function now?')
      .send('n')
      .send('\r')
      .wait('Do you want to edit your captcha-create-challenge function now?')
      .send('n')
      .send('\r')
      .wait('Enter the Google reCaptcha secret key:')
      .send('dummykey')
      .send('\r')
      .wait('Do you want to edit the local VerifyAuthChallengeResponse lambda function now?')
      .send('n')
      .send('\r')
      .wait('Do you want to edit your captcha-verify function now?')
      .send('n')
      .send('\r')
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}

export function addAuthWithDefaultSocial(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    const {
      FACEBOOK_APP_ID,
      FACEBOOK_APP_SECRET,
      GOOGLE_APP_ID,
      GOOGLE_APP_SECRET,
      AMAZON_APP_ID,
      AMAZON_APP_SECRET,
    }: any = getEnvVars();

    const missingVars = [];
    if (!FACEBOOK_APP_ID) { missingVars.push('FACEBOOK_APP_ID') };
    if (!FACEBOOK_APP_SECRET) { missingVars.push('FACEBOOK_APP_SECRET') };
    if (!GOOGLE_APP_ID) { missingVars.push('GOOGLE_APP_ID') };
    if (!GOOGLE_APP_SECRET) { missingVars.push('GOOGLE_APP_SECRET') };
    if (!AMAZON_APP_ID) { missingVars.push('AMAZON_APP_ID') };
    if (!AMAZON_APP_SECRET) { missingVars.push('AMAZON_APP_SECRET') };

    if (missingVars.length > 0) {
      throw new Error(`.env file is missing the following key/values: ${missingVars.join(', ')} `);
    }
    nexpect
      .spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use the default authentication and security configuration?')
      // j = down arrow
      .sendline('j')
      .sendline('\r')
      .wait('How do you want users to be able to sign in?')
      .sendline('\r')
      .wait('Do you want to configure advanced settings?')
      .sendline('\r')
      .wait('What domain name prefix you want us to create for you?')
      .sendline('\r')
      .wait('Enter your redirect signin URI:')
      .sendline('https://www.google.com/')
      .wait('Do you want to add another redirect signin URI')
      .sendline('n')
      .sendline('\r')
      .wait('Enter your redirect signout URI:')
      .sendline('https://www.nytimes.com/')
      .sendline('\r')
      .wait('Do you want to add another redirect signout URI')
      .sendline('n')
      .sendline('\r')
      .wait('Select the social providers you want to configure for your user pool:')
      .sendline('a')
      .sendline('\r')
      .wait('Enter your Facebook App ID for your OAuth flow:')
      .sendline(FACEBOOK_APP_ID)
      .sendline('\r')
      .wait('Enter your Facebook App Secret for your OAuth flow:')
      .sendline(FACEBOOK_APP_SECRET)
      .sendline('\r')
      .wait('Enter your Google Web Client ID for your OAuth flow:')
      .sendline(GOOGLE_APP_ID)
      .sendline('\r')
      .wait('Enter your Google Web Client Secret for your OAuth flow:')
      .sendline(GOOGLE_APP_SECRET)
      .sendline('\r')
      .wait('Enter your Amazon App ID for your OAuth flow:')
      .sendline(AMAZON_APP_ID)
      .sendline('\r')
      .wait('Enter your Amazon App Secret for your OAuth flow:')
      .sendline(AMAZON_APP_SECRET)
      .sendline('\r')
      .sendEof()
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}
