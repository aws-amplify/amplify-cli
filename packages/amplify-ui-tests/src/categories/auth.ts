
import * as nexpect from 'nexpect';
import { getCLIPath, isCI, getEnvVars, getAwsCLIPath, getProjectMeta } from '../utils';

const defaultSettings = {
  username: 'test01',
  password: 'The#test1',
  email: 'lizeyutest01@amazon.com',
  phone: '6666666666'
};


export async function signUpNewUser(
  cwd: string,
  settings: any = {},
  verbose: boolean = !isCI()
) {
    const meta = getProjectMeta(cwd);
    const {UserPoolId, AppClientIDWeb} = Object.keys(meta.auth).map(key => meta.auth[key])[0].output;
    const s = {...defaultSettings, ...settings,
      clientId: AppClientIDWeb,
      userPoolId: UserPoolId
    };
    await signUpUser(cwd, s, verbose);
    await comfirmSignUp(cwd, s, verbose);
    return s;
  }

function signUpUser(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    nexpect
    .spawn(getAwsCLIPath(), ['cognito-idp', 'sign-up', '--client-id', settings.clientId,
    '--username', settings.username, '--password',
    settings.password, '--user-attributes', `Name=email,Value=${settings.email}`,
    `Name=phone_number,Value=+1${settings.phone}`], { cwd, stripColors: true, verbose })
    .run(function(err: Error) {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  })
}

function comfirmSignUp(
  cwd: string,
  settings: any,
  verbose: boolean = !isCI()
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getAwsCLIPath(), ['cognito-idp', 'admin-confirm-sign-up', '--user-pool-id',
        settings.userPoolId, '--username', settings.username], { cwd, stripColors: true, verbose })
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  })
}




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
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      })
  })
}
