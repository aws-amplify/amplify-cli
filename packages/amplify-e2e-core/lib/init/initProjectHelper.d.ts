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
    region: string;
    local: boolean;
    disableAmplifyAppCreation: boolean;
    disableCIDetection: boolean;
    providerConfig: any;
    permissionsBoundaryArn: any;
};
export declare function initJSProjectWithProfile(cwd: string, settings?: Partial<typeof defaultSettings>): Promise<void>;
export declare function initAndroidProjectWithProfile(cwd: string, settings: Partial<typeof defaultSettings>): Promise<void>;
export declare function createRandomName(): string;
export declare function initIosProjectWithProfile(cwd: string, settings: Record<string, unknown>): Promise<void>;
export declare function initFlutterProjectWithProfile(cwd: string, settings: Record<string, unknown>): Promise<void>;
export declare function initProjectWithAccessKey(cwd: string, settings: {
    accessKeyId: string;
    secretAccessKey: string;
    region?: string;
}): Promise<void>;
export declare function initNewEnvWithAccessKey(cwd: string, s: {
    envName: string;
    accessKeyId: string;
    secretAccessKey: string;
}): Promise<void>;
export declare function initNewEnvWithProfile(cwd: string, s: {
    envName: string;
}): Promise<void>;
export declare function updatedInitNewEnvWithProfile(cwd: string, s: {
    envName: string;
}): Promise<void>;
export declare function amplifyInitSandbox(cwd: string, settings: Record<string, unknown>): Promise<void>;
export declare function amplifyVersion(cwd: string, expectedVersion: string, testingWithLatestCodebase?: boolean): Promise<void>;
export declare function amplifyStatusWithMigrate(cwd: string, expectedStatus: string, testingWithLatestCodebase: any): Promise<void>;
export declare function amplifyStatus(cwd: string, expectedStatus: string, testingWithLatestCodebase?: boolean): Promise<void>;
export declare function initHeadless(cwd: string, envName: string, appId: string): Promise<void>;
export {};
