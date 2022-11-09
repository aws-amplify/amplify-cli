/**
 * Shape of awscloudformation object within `--profile` payload for init/pull
 */
export type AwsProviderConfig = {
  configLevel: string,
  useProfile: boolean,
  profileName: string,
}

/**
 * Shape of `--categories` payload for init/pull
 */
export type CategoriesConfig = Record<string, unknown>;
