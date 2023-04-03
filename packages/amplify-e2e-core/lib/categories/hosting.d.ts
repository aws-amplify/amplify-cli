export declare function addDEVHosting(cwd: string): Promise<void>;
export declare function enableContainerHosting(cwd: string): Promise<void>;
export declare function addDevContainerHosting(cwd: string): Promise<void>;
export declare function addPRODHosting(cwd: string): Promise<void>;
export declare function removePRODCloudFront(cwd: string): Promise<void>;
export declare const amplifyPushWithUpdate: (cwd: string) => Promise<void>;
export declare const amplifyPublishWithUpdate: (cwd: string) => Promise<void>;
export declare function amplifyPublishWithoutUpdate(cwd: string): Promise<void>;
/**
 * executes publish command with yes flag
 */
export declare const amplifyPublishWithoutUpdateWithYesFlag: (cwd: string) => Promise<void>;
export declare function removeHosting(cwd: string): Promise<void>;
export declare function createReactTestProject(): Promise<string>;
export declare function resetBuildCommand(projectDir: string, newBuildCommand: string): string;
export declare function extractHostingBucketInfo(projectDir: string): any;
