
import * as nexpect from 'nexpect';
import { join } from 'path';
import * as fs from 'fs';

import { getCLIPath, isCI, getEnvVars } from '../utils';
const defaultSettings = {
  projectName: 'CLIIntegTestAuth',
};


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
      .wait('How do you want users to be able to sign in when using your Cognito User Pool?')
      .sendline('\r')
      .wait('What attributes are required for signing up?')
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
    } = getEnvVars();

    if (
      !FACEBOOK_APP_ID ||
      !FACEBOOK_APP_SECRET ||
      !GOOGLE_APP_ID ||
      !GOOGLE_APP_SECRET ||
      !AMAZON_APP_ID ||
      !AMAZON_APP_SECRET
    ) {
      throw new Error(
        'Please set social provider app IDs and app secrets in .env'
      );
    }
    nexpect
      .spawn(getCLIPath(), ['add', 'auth'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use the default authentication and security configuration?')
      .sendline('j')
      .sendline('\r')
      .wait('How do you want users to be able to sign in when using your Cognito User Pool?')
      .sendline('\r')
      .wait('What attributes are required for signing up?')
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
