import { Amplify, CloudFormation } from 'aws-sdk';
export declare function getConfiguredAmplifyClient(): Amplify;
export declare function getConfiguredCFNClient(): CloudFormation;
export declare function deleteAllAmplifyProjects(amplifyClient?: Amplify): Promise<void>;
export declare function deleteAmplifyStack(stackName: string, cfnClient?: CloudFormation): Promise<void>;
export declare function generateBackendEnvParams(appId: string, projectName: string, envName: string): {
    appId: string;
    envName: string;
    stackName: string;
    deploymentBucketName: string;
};
export declare function createConsoleApp(projectName: string, amplifyClient?: Amplify): Promise<string>;
export declare function deleteConsoleApp(appId: string, amplifyClient?: Amplify): Promise<void>;
export declare function createBackendEnvironment(backendParams: any, amplifyClient?: Amplify): Promise<void>;
