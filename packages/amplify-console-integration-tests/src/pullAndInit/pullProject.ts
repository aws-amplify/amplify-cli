import * as util from '../util';
import { nspawn as spawn } from '@aws-amplify/amplify-e2e-core';
import { EOL } from 'os';

const defaultSettings = {
  name: EOL,
  editor: EOL,
  appType: EOL,
  framework: EOL,
  srcDir: EOL,
  distDir: EOL,
  buildCmd: EOL,
  startCmd: EOL,
  useProfile: EOL,
  profileName: EOL,
};

export type FrontendConfig = {
  frontend: string;
  framework: string;
  config: {
    SourceDir: string;
    DistributionDir: string;
    BuildCommand: string;
    StartCommand: string;
  };
};
export function headlessPull(
  projectRootDirPath: string,
  amplifyParam: Record<string, unknown>,
  providersParam: Record<string, unknown>,
  categoryConfig?: Record<string, unknown>,
  frontendConfig?: FrontendConfig,
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
  if (frontendConfig) pullCommand.push('--frontend', JSON.stringify(frontendConfig));
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

export function authConfigPull(
  projectRootDirPath: string,
  params: { appId: string; envName: string },
  settings: Record<string, unknown> = {},
): Promise<void> {
  const pullCommand: string[] = ['pull'];
  Object.keys(params).forEach((key) => {
    if (params[key]) pullCommand.push(...[`--${key}`, JSON.stringify(params[key])]);
  });
  const mergedSettings = { ...defaultSettings, ...settings };
  return new Promise((resolve, reject) => {
    spawn(util.getCLIPath(), pullCommand, { cwd: projectRootDirPath, stripColors: true })
      .wait('Select the authentication method you want to use:')
      .sendCarriageReturn()
      .wait('Please choose the profile you want to use')
      .sendLine(mergedSettings.profileName)
      .wait('Choose your default editor:')
      .sendLine(mergedSettings.editor)
      .wait("Choose the type of app that you're building")
      .sendLine('javascript')
      .wait('What javascript framework are you using')
      .sendLine(mergedSettings.framework)
      .wait('Source Directory Path:')
      .sendLine(mergedSettings.srcDir)
      .wait('Distribution Directory Path:')
      .sendLine(mergedSettings.distDir)
      .wait('Build Command:')
      .sendLine(mergedSettings.buildCmd)
      .wait('Start Command:')
      .sendLine(mergedSettings.startCmd)
      .wait('Do you plan on modifying this backend?')
      .sendConfirmYes()
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
