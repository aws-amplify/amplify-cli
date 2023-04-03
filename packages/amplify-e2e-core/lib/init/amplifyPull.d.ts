/**
 * Interactive amplify pull
 */
export declare const amplifyPull: (cwd: string, settings: {
    override?: boolean;
    emptyDir?: boolean;
    appId?: string;
    withRestore?: boolean;
    noUpdateBackend?: boolean;
    envName?: string;
    yesFlag?: boolean;
}, testingWithLatestCodebase?: boolean) => Promise<void>;
/**
 * Interactive pull --sandboxId
 */
export declare const amplifyPullSandbox: (cwd: string, settings: {
    sandboxId: string;
    appType: string;
    framework: string;
}) => Promise<void>;
/**
 * Run non-interactive amplify pull
 */
export declare const amplifyPullNonInteractive: (cwd: string, settings: {
    appId: string;
    envName: string;
    frontend?: {
        frontend: string;
        config?: {
            ResDir?: string;
        };
    };
}) => Promise<void>;
/**
 * headless studio pull
 * instead of opening the browser for login pass the profile name so aws creds are used instead
 * accepts defaults by using yes flag
 *
 * if testing locally
 * set useDevCLI to `true`
 * use profile name in local aws config
 */
export declare const amplifyStudioHeadlessPull: (cwd: string, settings: {
    appId: string;
    envName: string;
    profileName?: string;
    useDevCLI?: boolean;
}) => Promise<void>;
