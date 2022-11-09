import execa from 'execa';
import { EOL } from 'os';
// eslint-disable-next-line import/no-cycle
import {
  nspawn as spawn, getCLIPath, getAmplifyConfig, getAwsProviderConfig,
} from '..';
import { CategoriesConfig } from './headless-types';

const defaultSettings = {
  name: EOL,
  // eslint-disable-next-line spellcheck/spell-checker
  envName: 'integtest',
  editor: EOL,
  appType: EOL,
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
  return spawn(getCLIPath(), ['pull', '--appId', s.appId, '--envName', s.envName], { cwd, stripColors: true })
    .wait('Select the authentication method you want to use:')
    .sendLine(s.useProfile)
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
    .sendCarriageReturn()
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
  projectName: string,
  envName: string,
  categoriesConfig?: CategoriesConfig,
  awsProviderConfig = getAwsProviderConfig(),
): Promise<void> => {
  const amplifyConfig = getAmplifyConfig(projectName, envName);
  const args = [
    'pull',
    '--yes',
    '--amplify',
    JSON.stringify(amplifyConfig),
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
