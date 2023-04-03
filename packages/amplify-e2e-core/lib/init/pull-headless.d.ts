import { CategoriesConfig } from './headless-types';
declare const defaultSettings: {
    name: string;
    envName: string;
    editor: string;
    appType: string;
    framework: string;
    srcDir: string;
    distDir: string;
    buildCmd: string;
    startCmd: string;
    useProfile: string;
    profileName: string;
    appId: string;
};
/**
 * Executes amplify pull
 */
export declare const pullProject: (cwd: string, settings: Partial<typeof defaultSettings>) => Promise<void>;
/**
 * Executes non-interactive pull command
 */
export declare const nonInteractivePullAttach: (projRoot: string, amplifyPullConfig: AmplifyPullConfig, categoriesConfig?: CategoriesConfig, awsProviderConfig?: import("./headless-types").AwsProviderConfig | import("./non-interactive-init").AwsProviderGeneralConfig) => Promise<void>;
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
export declare const getAmplifyPullConfig: (projectName: string, envName: string, appId: string) => AmplifyPullConfig;
export {};
