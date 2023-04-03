export declare const amplifyOverrideRoot: (cwd: string, settings: {
    testingWithLatestCodebase?: boolean;
}) => Promise<void>;
export declare const amplifyOverrideAuth: (cwd: string) => Promise<void>;
export declare const amplifyOverrideApi: (cwd: string) => Promise<void>;
export declare const buildOverrides: (cwd: string) => Promise<void>;
