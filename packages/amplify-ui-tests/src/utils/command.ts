import * as nexpect from 'nexpect';
import { isCI, getProjectMeta, getAwsCLIPath } from '.';

//30s to start server
const SEVER_LAUNCH_TIME: number = 30000;
//default settings for new user sign up
const defaultSettings = {
    username: process.env.COGNITO_SIGN_IN_USERNAME ? process.env.COGNITO_SIGN_IN_USERNAME : 'test01',
    password: process.env.COGNITO_SIGN_IN_PASSWORD ? process.env.COGNITO_SIGN_IN_PASSWORD : 'The#test1',
    email: process.env.COGNITO_SIGN_IN_EMAIL ? process.env.COGNITO_SIGN_IN_EMAIL : 'lizeyutest01@amazon.com',
    phone: process.env.COGNITO_SIGN_IN_PHONE_NUMBER ? process.env.COGNITO_SIGN_IN_PHONE_NUMBER : '6666666666'
};

export function gitCloneSampleApp(
    cwd: string,
    settings: { repo: string},
    verbose: boolean = !isCI()
) {
    return new Promise((resolve, reject) => {
        nexpect.spawn('git', ['clone', '-b', 'dev', '--single-branch', settings.repo], {cwd, stripColors: true, verbose})
        .run(err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

export function buildApp(
    cwd: string,
    settings: any,
    verbose: boolean = !isCI()
) {
    return new Promise((resolve, reject) => {
        nexpect.spawn('npm', ['run', 'setup-dev'], {cwd, stripColors: true, verbose})
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
    settings: { platform: string, category: string},
    verbose: boolean = true
) {
    let isPassed: boolean = true;
    return new Promise((resolve) => {
        nexpect
            .spawn('npm', ['run', 'cypress:' + settings.platform + ':' + settings.category], {cwd, stripColors: true, verbose})
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
    settings: {category: string},
    verbose: boolean = !isCI()
) {
    nexpect.spawn('yarn', ['start:' + settings.category], {cwd, stripColors: true, verbose})
    .run((err: Error) => {
        if (err) {
            console.log(err)
        }
    })
    //waiting for the server to launch
    await sleep(SEVER_LAUNCH_TIME);
}

export function closeServer(
    cwd: string,
    settings: {port: string},
    verbose: boolean = !isCI()
) {
    return new Promise((resolve, reject) => {
        nexpect.spawn('lsof', ['-t', '-i:' + settings.port], {cwd, stripColors: true, verbose})
        .run((err, output) => {
            if (err) {
                reject(err);
            } else {
                nexpect.spawn('kill', ['-9', ...output], {cwd, stripColors: true, verbose})
                .run(err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                })
            }
        })
    })
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
