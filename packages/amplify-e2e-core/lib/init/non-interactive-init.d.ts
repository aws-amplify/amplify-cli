import { ExecaReturnValue } from 'execa';
import { CategoriesConfig, AwsProviderConfig } from './headless-types';
/**
 * Executes a non-interactive init to attach a local project to an existing cloud environment
 */
export declare const nonInteractiveInitAttach: (projRoot: string, amplifyInitConfig: AmplifyInitConfig, awsProviderConfig: AwsProviderConfig | AwsProviderGeneralConfig, categoriesConfig?: CategoriesConfig) => Promise<void>;
/**
 * Executes a non-interactive init to migrate a local project to an existing cloud environment with forcePush flag
 */
export declare const nonInteractiveInitWithForcePushAttach: (projRoot: string, amplifyInitConfig: AmplifyInitConfig, categoriesConfig?: CategoriesConfig, testingWithLatestCodebase?: boolean, awsProviderConfig?: AwsProviderConfig | AwsProviderGeneralConfig, rejectOnFailure?: boolean) => Promise<ExecaReturnValue<string>>;
/**
 * Returns an AmplifyConfig object with a default editor
 */
export declare const getAmplifyInitConfig: (projectName: string, envName: string) => AmplifyInitConfig;
/**
 * Returns a default AwsProviderConfig
 */
export declare const getAwsProviderConfig: (profileType?: string) => AwsProviderConfig | AwsProviderGeneralConfig;
/**
 * Returns a general AwsProviderConfig
 */
export declare const getAwsProviderGeneralConfig: () => AwsProviderGeneralConfig;
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
