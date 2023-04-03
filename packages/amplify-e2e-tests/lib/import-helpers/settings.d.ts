import { AddAuthUserPoolOnlyWithOAuthSettings, AddAuthUserPoolOnlyNoOAuthSettings, AddAuthIdentityPoolAndUserPoolWithOAuthSettings, AddStorageSettings, AddDynamoDBSettings } from '@aws-amplify/amplify-e2e-core';
export declare const createNoOAuthSettings: (projectPrefix: string, shortId: string) => AddAuthUserPoolOnlyNoOAuthSettings;
export declare const createUserPoolOnlyWithOAuthSettings: (projectPrefix: string, shortId: string) => AddAuthUserPoolOnlyWithOAuthSettings;
export declare const createIDPAndUserPoolWithOAuthSettings: (projectPrefix: string, shortId: string) => AddAuthIdentityPoolAndUserPoolWithOAuthSettings;
export declare const createStorageSettings: (projectPrefix: string, shortId: string) => AddStorageSettings;
export declare const createDynamoDBSettings: (projectPrefix: string, shortId: string) => AddDynamoDBSettings;
