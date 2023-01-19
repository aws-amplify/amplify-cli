import execa from 'execa';
// eslint-disable-next-line import/no-cycle
import { getCLIPath, TEST_PROFILE_NAME } from '..';
import { CategoriesConfig, AwsProviderConfig } from './headless-types';

/**
 * Executes a non-interactive init to attach a local project to an existing cloud environment
 */
export const nonInteractiveInitAttach = async (
  projRoot: string,
  amplifyInitConfig: AmplifyInitConfig,
  categoriesConfig?: CategoriesConfig,
  awsProviderConfig = getAwsProviderConfig(),
): Promise<void> => {
  const args = [
    'init',
    '--yes',
    '--amplify',
    JSON.stringify(amplifyInitConfig),
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
 * Returns an AmplifyConfig object with a default editor
 */
export const getAmplifyInitConfig = (projectName: string, envName: string): AmplifyInitConfig => ({
  projectName,
  envName,
  defaultEditor: 'code',
});

/**
 * Returns a default AwsProviderConfig
 */
export const getAwsProviderConfig = (): AwsProviderConfig => ({
  configLevel: 'project',
  useProfile: true,
  profileName: TEST_PROFILE_NAME,
});

/**
 * Shape of `--amplify` payload for init/pull
 */
export type AmplifyInitConfig = {
  projectName: string,
  envName: string,
  defaultEditor: string,
};
