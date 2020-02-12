import * as nexpect from 'nexpect';
import { getCLIPath, isCI, getEnvVars } from '../utils';

export function addAuthWithDefault(cwd: string, settings: any = {}, verbose: boolean = !isCI()) {
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
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function addAuthWithDefaultSocial(cwd: string, settings: any = {}, verbose: boolean = !isCI()) {
  return new Promise((resolve, reject) => {
    const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, GOOGLE_APP_ID, GOOGLE_APP_SECRET, AMAZON_APP_ID, AMAZON_APP_SECRET,
      OIDC_APP_ID, OIDC_APP_SECRET, OIDC_APP_ISSUER, OIDC_APP_SCOPES, OIDC_APP_MAPPING }: any = getEnvVars();

    const missingVars = [];
    if (!FACEBOOK_APP_ID) {
      missingVars.push('FACEBOOK_APP_ID');
    }
    if (!FACEBOOK_APP_SECRET) {
      missingVars.push('FACEBOOK_APP_SECRET');
    }
    if (!GOOGLE_APP_ID) {
      missingVars.push('GOOGLE_APP_ID');
    }
    if (!GOOGLE_APP_SECRET) {
      missingVars.push('GOOGLE_APP_SECRET');
    }
    if (!AMAZON_APP_ID) {
      missingVars.push('AMAZON_APP_ID');
    }
    if (!AMAZON_APP_SECRET) {
      missingVars.push('AMAZON_APP_SECRET');
    }
    if (!OIDC_APP_ID) {
      missingVars.push('OIDC_APP_ID');
    }
    if (!OIDC_APP_SECRET) {
      missingVars.push('OIDC_APP_SECRET');
    }
    if (!OIDC_APP_ISSUER) {
      missingVars.push('OIDC_APP_ISSUER');
    }
    if (!OIDC_APP_SCOPES) {
      missingVars.push('OIDC_APP_SCOPES');
    }
    if (!OIDC_APP_MAPPING) {
      missingVars.push('OIDC_APP_MAPPING');
    }

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
      .sendline('')
      .wait('Do you want to configure advanced settings?')
      .sendline('')
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
      .wait('Select your OIDC Attributes Request Method:')
      .sendline('\r')
      .wait('Enter your OIDC App ID for your OAuth flow:')
      .sendline(OIDC_APP_ID)
      .sendline('\r')
      .wait('Enter your OIDC App Secret for your OAuth flow:')
      .sendline(OIDC_APP_SECRET)
      .sendline('\r')
      .wait('Enter your OIDC Issuer url:')
      .sendline(OIDC_APP_ISSUER)
      .sendline('\r')
      .wait('Select your OIDC Attributes Request Method:')
      .sendline('\r')
      .wait('Enter authorize scopes used by your application during authentication to authorize access to a user\'s details, like name and picture as a JSON array (ec. [\"openid\",\"test\"]):')
      .sendline(OIDC_APP_SCOPES)
      .sendline('\r')
      .wait('Enter the expected attributes mapping between your OIDC provider and your Cognito user as a JSON (ex. \"{\"email\":\"EMAIL\",\"username\":\"sub\"}\"):')
      .sendline(OIDC_APP_MAPPING)
      .sendline('\r')
      .sendEof()
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
