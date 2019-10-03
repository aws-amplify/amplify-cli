import * as nexpect from 'nexpect';

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
  settings: any = {},
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
      .run(function(err: Error) {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

export function initAndroidProject(
  cwd: string,
  settings: any = {},
  verbose: Boolean = isCI() ? false : true
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['init'], {cwd, stripColors: true, verbose})
      .wait('Enter a name for the project')
      .sendline('\r')
      .wait('Enter a name for the environment')
      .sendline('integtest')
      .wait('Choose your default editor:')
      .sendline('\r')
      .wait("Choose the type of app that you're building")
      .sendline('\r')
      .wait('Where is your Res directory:')
      .sendline('\r')
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
  })
}

export function initIosProject(
  cwd: string,
  settings: any = {},
  verbose: Boolean = isCI() ? false : true
) {
  return new Promise((resolve, reject) => {
    nexpect
      .spawn(getCLIPath(), ['init'], {cwd, stripColors: true, verbose})
      .wait('Enter a name for the project')
      .sendline('\r')
      .wait('Enter a name for the environment')
      .sendline('integtest')
      .wait('Choose your default editor:')
      .sendline('\r')
      .wait("Choose the type of app that you're building")
      .sendline('\r')
      // .sendline('\j\j\r')
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
  })
}
