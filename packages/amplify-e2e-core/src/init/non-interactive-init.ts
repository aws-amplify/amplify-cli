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
 * Executes a non-interactive init to create a new Project
 */
export const headlessInit = async (
  projRoot: string,
  amplifyInitConfig: AmplifyInitConfig,
  frontendConfig: AmplifyFrontend,
  awsProviderConfig: AwsProviderConfig | AwsProviderGeneralConfig,
): Promise<void> => {
  const args = [
    'init',
    '--amplify',
    JSON.stringify(amplifyInitConfig),
    '--frontend',
    JSON.stringify(frontendConfig),
    '--providers',
    JSON.stringify({
      awscloudformation: awsProviderConfig,
    }),
    '--yes',
  ];
  await execa(getCLIPath(true), args, { cwd: projRoot });
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
    '--forcePush',
  ];
  if (categoriesConfig) {
    args.push('--categories', JSON.stringify(categoriesConfig));
  }
  await execa(getCLIPath(testingWithLatestCodebase), args, { cwd: projRoot });
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
 * Returns an frontend Config object of passed frontend type
 */

export const getAmplifyFrontend = (): AmplifyFrontend => ({
  frontend: 'javascript',
  framework: 'react',
  config: getJavascriptConfig(),
});

const getJavascriptConfig = (): JavaScriptConfig => ({
  BuildCommand: 'npm run build',
  DistributionDir: 'testDist',
  SourceDir: 'src',
  StartCommand: 'npm run start',
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

type JavaScriptConfig = {
  SourceDir: string;
  DistributionDir: string;
  BuildCommand: string;
  StartCommand: string;
};

type AmplifyFrontend = {
  frontend: string;
  framework: string;
  config: JavaScriptConfig;
};

export type AwsProviderGeneralConfig = {
  configLevel: string;
};
