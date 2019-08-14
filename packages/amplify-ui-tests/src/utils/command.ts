import * as nexpect from 'nexpect';
import { isCI, getProjectMeta, getAwsCLIPath } from '.';
import { exec } from 'child_process';

//30s to start server
const SEVER_LAUNCH_TIME: number = 30000;
//default settings for new user sign up
const defaultSettings = {
    username: process.env.CYPRESS_COGNITO_SIGN_IN_USERNAME ? process.env.CYPRESS_COGNITO_SIGN_IN_USERNAME : 'test01',
    password: process.env.CYPRESS_COGNITO_SIGN_IN_PASSWORD ? process.env.CYPRESS_COGNITO_SIGN_IN_PASSWORD : 'The#test1',
    email: process.env.CYPRESS_COGNITO_SIGN_IN_EMAIL ? process.env.CYPRESS_COGNITO_SIGN_IN_EMAIL : 'lizeyutest01@amazon.com',
    phone: process.env.CYPRESS_COGNITO_SIGN_IN_PHONE_NUMBER ? process.env.CYPRESS_COGNITO_SIGN_IN_PHONE_NUMBER : '6666666666'
};

export function gitCloneSampleApp(
    cwd: string,
    settings: { repo: string},
    verbose: boolean = !isCI()
) {
    return new Promise((resolve, reject) => {
        nexpect.spawn('git', ['clone', settings.repo], {cwd, stripColors: true, verbose})
        .run(err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

export function setupCypress(cwd: string) {
    return new Promise((resolve, reject) => {
        exec('CYPRESS_INSTALL_BINARY=0 npm install', {cwd: cwd}, function(err: Error) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

export function buildApp(
    cwd: string,
    settings?: any,
    verbose: boolean = !isCI()
) {
    return new Promise((resolve, reject) => {
        nexpect.spawn('yarn', {cwd, stripColors: true, verbose})
        .run(err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

export function runCypressTest(
    cwd: string,
    settings?: any,
    verbose: boolean = true
) {
    let isPassed: boolean = true;
    let options = ['cypress', 'run'];
    if (!isCI()) {
        options.push('--headed');
    }
    return new Promise((resolve) => {
        nexpect
            .spawn('yarn', options, {cwd, stripColors: true, verbose})
            .wait('All specs passed!')
            .run(function(err: Error) {
                if (err) {
                    isPassed = false;
                }
                resolve(isPassed);
            });
    })
}

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function startServer(
    cwd: string,
    settings: any,
) {
    exec('PORT=' + settings.port + ' yarn start', {cwd: cwd});
    //waiting for the server to launch
    await sleep(SEVER_LAUNCH_TIME);
}

export function closeServer(
    settings: {port: string},
) {
    exec(`kill -9 $(lsof -t -i:${settings.port})`);
}

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
      comfirmSignUp(cwd, s, verbose);
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
    // Comfirm the sign-up status and get the email verified
    exec(`aws cognito-idp admin-confirm-sign-up --user-pool-id ${settings.userPoolId} --username ${settings.username}`);
    exec(`aws cognito-idp admin-update-user-attributes --user-pool-id ${settings.userPoolId} --username ${settings.username}` +
    ` --user-attributes Name=email_verified,Value=true`);
  }
