import * as nexpect from 'nexpect';
import { join } from 'path';

import { getCLIPath, isCI } from '../utils';
const defaultSettings = {
  name: '\r',
  envName: 'integtest',
  editor: '\r',
  appType: '\r',
  framework: '\r',
  srcDir: '\r',
  distDir: '\r',
  buildCmd: '\r',
  startCmd: '\r',
  useProfile: '\r',
  profileName: '\r'
};

export default function initProjectWithProfile(
  cwd: string,
  settings: Object,
  verbose: Boolean = isCI() ? false : true
) {
  const s = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['init'], { cwd, stripColors: true, verbose })
      .wait('Enter a name for the project')
      .sendline(s.name)
      .wait('Enter a name for the environment')
      .sendline(s.envName)
      .wait('Choose your default editor:')
      .sendline(s.editor)
      .wait("Choose the type of app that you're building")
      .sendline(s.appType)
      .wait('What javascript framework are you using')
      .sendline(s.framework)
      .wait('Source Directory Path:')
      .sendline(s.srcDir)
      .wait('Distribution Directory Path:')
      .sendline(s.distDir)
      .wait('Build Command:')
      .sendline(s.buildCmd)
      .wait('Start Command:')
      .sendline('\r')
      .wait('Using default provider  awscloudformation')
      .wait('Do you want to use an AWS profile?')
      .sendline('y')
      .wait('Please choose the profile you want to use')
      .sendline(s.profileName)
      .wait(
        'Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything'
      )
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function initProjectWithAccessKey(
  cwd: string,
  settings: { accessKeyId: string; secretAccessKey: string },
  verbose: Boolean = isCI() ? false : true
) {
  const s = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['init'], { cwd, stripColors: true, verbose })
      .wait('Enter a name for the project')
      .sendline(s.name)
      .wait('Enter a name for the environment')
      .sendline(s.envName)
      .wait('Choose your default editor:')
      .sendline(s.editor)
      .wait("Choose the type of app that you're building")
      .sendline(s.appType)
      .wait('What javascript framework are you using')
      .sendline(s.framework)
      .wait('Source Directory Path:')
      .sendline(s.srcDir)
      .wait('Distribution Directory Path:')
      .sendline(s.distDir)
      .wait('Build Command:')
      .sendline(s.buildCmd)
      .wait('Start Command:')
      .sendline('\r')
      .wait('Using default provider  awscloudformation')
      .wait('Do you want to use an AWS profile?')
      .sendline('n')
      .wait('accessKeyId')
      .sendline(s.accessKeyId)
      .wait('secretAccessKey')
      .sendline(s.secretAccessKey)
      .wait('region')
      .sendline('us-east-1')
      .wait(
        'Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything'
      )
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function initNewEnvWithAccessKey(
  cwd: string,
  s: { envName: string; accessKeyId: string; secretAccessKey: string },
  verbose: Boolean = isCI() ? false : true
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['init'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use an existing environment?')
      .sendline('n')
      .wait('Enter a name for the environment')
      .sendline(s.envName)
      .wait('Using default provider  awscloudformation')
      .wait('Do you want to use an AWS profile?')
      .sendline('n')
      .wait('accessKeyId')
      .sendline(s.accessKeyId)
      .wait('secretAccessKey')
      .sendline(s.secretAccessKey)
      .wait('region')
      .sendline('us-east-1')
      .wait(
        'Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything'
      )
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function initNewEnvWithProfile(
  cwd: string,
  s: { envName: string },
  verbose: Boolean = isCI() ? false : true
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['init'], { cwd, stripColors: true, verbose })
      .wait('Do you want to use an existing environment?')
      .sendline('n')
      .wait('Enter a name for the environment')
      .sendline(s.envName)
      .wait('Using default provider  awscloudformation')
      .wait('Do you want to use an AWS profile?')
      .sendline('y')
      .wait('Please choose the profile you want to use')
      .sendline('\r')
      .wait(
        'Try "amplify add api" to create a backend API and then "amplify publish" to deploy everything'
      )
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
