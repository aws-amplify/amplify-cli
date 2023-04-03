import { $TSObject } from 'amplify-cli-core';
import { AuthProjectDetails, StorageProjectDetails } from '.';
import { AppClientSettings, DynamoDBProjectDetails } from './types';
export declare const getShortId: () => string;
export declare const getAuthProjectDetails: (projectRoot: string) => AuthProjectDetails;
export declare const getOGAuthProjectDetails: (projectRoot: string) => AuthProjectDetails;
export declare const readResourceParametersJson: (projectRoot: string, category: string, resourceName: string) => $TSObject;
export declare const readRootStack: (projectRoot: string) => $TSObject;
export declare const getOGStorageProjectDetails: (projectRoot: string) => StorageProjectDetails;
export declare const getStorageProjectDetails: (projectRoot: string) => StorageProjectDetails;
export declare const getS3ResourceName: (projectRoot: string) => string;
export declare const getOGDynamoDBProjectDetails: (projectRoot: string) => DynamoDBProjectDetails;
export declare const getDynamoDBProjectDetails: (projectRoot: string) => DynamoDBProjectDetails;
export declare const getDynamoDBResourceName: (projectRoot: string) => string;
export declare const addAppClientWithSecret: (profileName: string, projectRoot: string, clientName: string, settings: AppClientSettings) => Promise<{
    appClientId: string;
    appclientSecret: string;
}>;
export declare const addAppClientWithoutSecret: (profileName: string, projectRoot: string, clientName: string, settings: AppClientSettings) => Promise<{
    appClientId: string;
    appclientSecret: string;
}>;
export declare const deleteAppClient: (profileName: string, projectRoot: string, clientId: string) => Promise<void>;
/**
 * sets up a project with auth (UserPool only or UserPool & IdentityPool)
 */
export declare const setupOgProjectWithAuth: (ogProjectRoot: string, ogProjectSettings: {
    name: string;
}, withIdentityPool?: boolean) => Promise<AuthProjectDetails>;
