import execa, { ExecaReturnValue } from 'execa';
// eslint-disable-next-line import/no-cycle
import { getCLIPath, TEST_PROFILE_NAME } from '..';
import { CategoriesConfig, AwsProviderConfig } from './headless-types';

/**
 * Executes a non-interactive init to attach a local project to an existing cloud environment
 */
export const nonInteractiveInitAttach = async (
  projRoot: string,
  amplifyInitConfig: AmplifyInitConfig,
  awsProviderConfig: AwsProviderConfig | AwsProviderGeneralConfig,
  categoriesConfig?: CategoriesConfig,
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
 * Executes a non-interactive init to migrate a local project to an existing cloud environment with forcePush flag
 */
export const nonInteractiveInitWithForcePushAttach = async (
  projRoot: string,
  amplifyInitConfig: AmplifyInitConfig,
  categoriesConfig?: CategoriesConfig,
  testingWithLatestCodebase = false,
  awsProviderConfig = getAwsProviderConfig(),
  rejectOnFailure = true,
): Promise<ExecaReturnValue<string>> => {
  const args = [
    'init',
    '--yes',
    '--amplify',
    JSON.stringify(amplifyInitConfig),
    '--providers',
    JSON.stringify({
      awscloudformation: awsProviderConfig,
    }),
    '--forcePush',
    '--debug',
  ];
  if (categoriesConfig) {
    args.push('--categories', JSON.stringify(categoriesConfig));
  }
  return execa(getCLIPath(testingWithLatestCodebase), args, { cwd: projRoot, reject: rejectOnFailure });
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
export const getAwsProviderConfig = (profileType?: string): AwsProviderConfig | AwsProviderGeneralConfig => {
  if (profileType === 'general') {
    return getAwsProviderGeneralConfig();
  } else {
    return {
      configLevel: 'project',
      useProfile: true,
      profileName: TEST_PROFILE_NAME,
    };
  }
};

/**
 * Returns a general AwsProviderConfig
 */
export const getAwsProviderGeneralConfig = (): AwsProviderGeneralConfig => ({
  configLevel: 'general',
});

/**
 * Shape of `--amplify` payload for init/pull
 */
export type AmplifyInitConfig = {
  projectName: string;
  envName: string;
  defaultEditor: string;
  frontend?: string;
};

export type AwsProviderGeneralConfig = {
  configLevel: string;
};
