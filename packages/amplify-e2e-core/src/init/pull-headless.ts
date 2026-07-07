import execa from 'execa';
import { EOL } from 'os';
// eslint-disable-next-line import/no-cycle
import { nspawn as spawn, getCLIPath, getAwsProviderConfig } from '..';
import { CategoriesConfig } from './headless-types';
import { AmplifyFrontend } from '@aws-amplify/amplify-cli-core';

const defaultSettings = {
  name: EOL,
  // eslint-disable-next-line spellcheck/spell-checker
  envName: 'integtest',
  editor: EOL,
  appType: AmplifyFrontend.javascript,
  framework: EOL,
  srcDir: EOL,
  distDir: EOL,
  buildCmd: EOL,
  startCmd: EOL,
  useProfile: EOL,
  profileName: EOL,
  appId: '',
};

/**
 * Executes amplify pull
 */
export const pullProject = (cwd: string, settings: Partial<typeof defaultSettings>): Promise<void> => {
  const s = { ...defaultSettings, ...settings };
  const chain = spawn(getCLIPath(), ['pull', '--appId', s.appId, '--envName', s.envName], { cwd, stripColors: true })
    .wait('Select the authentication method you want to use:')
    .sendLine(s.useProfile)
    .wait('Please choose the profile you want to use')
    .sendLine(s.profileName)
    .wait('Choose your default editor:')
    .sendLine(s.editor)
    .wait("Choose the type of app that you're building")
    .sendLine(s.appType);

  switch (s.appType) {
    case AmplifyFrontend.javascript:
      chain
        .wait('What javascript framework are you using')
        .sendLine(s.framework)
        .wait('Source Directory Path:')
        .sendLine(s.srcDir)
        .wait('Distribution Directory Path:')
        .sendLine(s.distDir)
        .wait('Build Command:')
        .sendLine(s.buildCmd)
        .wait('Start Command:')
        .sendCarriageReturn();
      break;
    case AmplifyFrontend.flutter:
      chain.wait('Where do you want to store your configuration file?').sendCarriageReturn();
      break;
    default:
      throw new Error(`Unsupported app type: ${s.appType}`);
  }

  return chain
    .wait('Do you plan on modifying this backend?')
    .sendConfirmNo()
    .wait('Added backend environment config object to your project.')
    .runAsync();
};

/**
 * Executes non-interactive pull command
 */
export const nonInteractivePullAttach = async (
  projRoot: string,
  amplifyPullConfig: AmplifyPullConfig,
  categoriesConfig?: CategoriesConfig,
  awsProviderConfig = getAwsProviderConfig(),
): Promise<void> => {
  const args = [
    'pull',
    '--yes',
    '--amplify',
    JSON.stringify(amplifyPullConfig),
    '--providers',
    JSON.stringify({
      awscloudformation: awsProviderConfig,
    }),
  ];
  if (categoriesConfig) {
    args.push('--categories', JSON.stringify(categoriesConfig));
  }
  await execa(getCLIPath(), args, { cwd: projRoot });
};

/**
 * Shape of `--amplify` parameter for pull
 */
export type AmplifyPullConfig = {
  projectName: string;
  envName: string;
  appId: string;
  defaultEditor: string;
};

/**
 * Returns a default AmplifyPullConfig
 */
export const getAmplifyPullConfig = (projectName: string, envName: string, appId: string): AmplifyPullConfig => ({
  projectName,
  envName,
  appId,
  defaultEditor: 'code',
});
