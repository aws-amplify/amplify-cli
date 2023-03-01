/**
 * Shape of awscloudformation object  payload for init/pull
 */
export type AwsProviderConfig = AwsProviderProfileConfig | AwsProviderGeneralConfig;

/**
 * Shape of awscloudformation object within `--profile` payload for init/pull
 */
export type AwsProviderProfileConfig = {
  configLevel: string;
  useProfile: boolean;
  profileName: string;
};

/**
 * Shape of awscloudformation object when general config is used for init/pull
 */

export type AwsProviderGeneralConfig = {
  configLevel: string;
};

/**
 * amplify profile config type
 */
export type AmplifyProfileConfig = 'accessKeys' | 'profile' | 'general';

/**
 * Shape of `--categories` payload for init/pull
 */
export type CategoriesConfig = Record<string, unknown>;
