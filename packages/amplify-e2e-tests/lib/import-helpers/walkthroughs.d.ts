export declare const importUserPoolOnly: (cwd: string, autoCompletePrefix: string, clientNames?: {
    web?: string;
    native?: string;
}) => Promise<unknown>;
export declare const importIdentityPoolAndUserPool: (cwd: string, autoCompletePrefix: string, clientNames?: {
    web?: string;
    native?: string;
}) => Promise<unknown>;
export declare const removeImportedAuthWithDefault: (cwd: string) => Promise<unknown>;
export declare const removeImportedAuthHeadless: (cwd: string, authResourceName: string) => Promise<void>;
export declare const addS3WithAuthConfigurationMismatchErrorExit: (cwd: string, settings: any) => Promise<unknown>;
export declare const headlessPullExpectError: (projectRoot: string, amplifyParameters: Object, providersParameter: Object, errorMessage: string, categoriesParameter?: Object, frontendParameter?: Object) => Promise<void>;
export declare const headlessPull: (projectRoot: string, amplifyParameters: Object, providersParameter: Object, categoriesParameter?: Object, frontendParameter?: Object) => Promise<void>;
export declare const importS3: (cwd: string, autoCompletePrefix: string) => Promise<void>;
export declare const removeImportedS3WithDefault: (cwd: string) => Promise<void>;
export declare const importDynamoDBTable: (cwd: string, autoCompletePrefix: string) => Promise<void>;
export declare const removeImportedDynamoDBWithDefault: (cwd: string) => Promise<void>;
