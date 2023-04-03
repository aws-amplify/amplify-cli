type AmplifyConfiguration = {
    accessKeyId: string;
    secretAccessKey: string;
    profileName?: string;
    region?: string;
};
export declare const amplifyRegions: string[];
export declare function amplifyConfigure(settings: AmplifyConfiguration): Promise<void>;
export declare const amplifyConfigureBeforeOrAtV10_7: (settings: AmplifyConfiguration) => Promise<void>;
export declare function amplifyConfigureProject(settings: {
    cwd: string;
    enableContainers?: boolean;
    configLevel?: string;
    profileOption?: string;
    authenticationOption?: string;
    region?: string;
}): Promise<void>;
export {};
