/**
 * checks to see if the pinpoint app exists
 */
export declare function pinpointAppExist(pinpointProjectId: string): Promise<boolean>;
/**
 * initializes a project to test pinpoint
 */
export declare function initProjectForPinpoint(cwd: string): Promise<void>;
/**
 * adds a pinpoint resource, you may specific a name for the resource
 */
export declare function addPinpointAnalytics(cwd: string, testingWithLatestCodebase?: boolean, pinPointResourceName?: string): Promise<string>;
/**
 * calls amplify push and verifies that the pinpoint resource succeeds
 */
export declare const pushToCloud: (cwd: string) => Promise<void>;
/**
 * delete the project
 */
export declare const amplifyDelete: (cwd: string) => Promise<void>;
