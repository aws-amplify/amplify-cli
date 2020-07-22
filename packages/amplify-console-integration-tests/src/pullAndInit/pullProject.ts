import * as util from '../util';
import { nspawn as spawn, getSocialProviders } from 'amplify-e2e-core';

const defaultSettings = {
  name: '\r',
  editor: '\r',
  appType: '\r',
  framework: '\r',
  srcDir: '\r',
  distDir: '\r',
  buildCmd: '\r',
  startCmd: '\r',
  useProfile: '\r',
  profileName: '\r',
};

export function headlessPull(
  projectRootDirPath: string,
  amplifyParam: Object,
  providersParam: Object,
  categoryConfig?: Object,
): Promise<void> {
  const pullCommand: string[] = [
    'pull',
    '--amplify',
    JSON.stringify(amplifyParam),
    '--providers',
    JSON.stringify(providersParam),
    '--no-override',
    '--yes',
  ];
  if (categoryConfig) pullCommand.push(...['--categories', JSON.stringify(categoryConfig)]);
  return new Promise((resolve, reject) => {
    spawn(util.getCLIPath(), pullCommand, { cwd: projectRootDirPath, stripColors: true }).run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

export function authConfigPull(projectRootDirPath: string, params: { appId: string; envName: string }, settings: Object = {}) {
  const pullCommand: string[] = ['pull'];
  Object.keys(params).forEach(key => {
    if (params[key]) pullCommand.push(...[`--${key}`, JSON.stringify(params[key])]);
  });
  const s = { ...defaultSettings, ...settings };
  const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, GOOGLE_APP_ID, GOOGLE_APP_SECRET, AMAZON_APP_ID, AMAZON_APP_SECRET } = getSocialProviders();
  return new Promise((resolve, reject) => {
    spawn(util.getCLIPath(), pullCommand, { cwd: projectRootDirPath, stripColors: true })
      .wait('Do you want to use an AWS profile?')
      .sendLine('y')
      .wait('Please choose the profile you want to use')
      .sendLine(s.profileName)
      .wait('Choose your default editor:')
      .sendLine(s.editor)
      .wait("Choose the type of app that you're building")
      .sendLine(s.appType)
      .wait('What javascript framework are you using')
      .sendLine(s.framework)
      .wait('Source Directory Path:')
      .sendLine(s.srcDir)
      .wait('Distribution Directory Path:')
      .sendLine(s.distDir)
      .wait('Build Command:')
      .sendLine(s.buildCmd)
      .wait('Start Command:')
      .sendLine(s.startCmd)
      .wait('Do you plan on modifying this backend?')
      .sendLine('y')
      .wait('Enter your Facebook App ID for your OAuth flow:')
      .sendLine(FACEBOOK_APP_ID)
      .wait('Enter your Facebook App Secret for your OAuth flow:')
      .sendLine(FACEBOOK_APP_SECRET)
      .wait('Enter your Google Web Client ID for your OAuth flow:')
      .sendLine(GOOGLE_APP_ID)
      .wait('Enter your Google Web Client Secret for your OAuth flow:')
      .sendLine(GOOGLE_APP_SECRET)
      .wait('Enter your Amazon App ID for your OAuth flow:')
      .sendLine(AMAZON_APP_ID)
      .wait('Enter your Amazon App Secret for your OAuth flow:')
      .sendLine(AMAZON_APP_SECRET)
      .wait('Successfully pulled backend environment dev from the cloud.')
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
