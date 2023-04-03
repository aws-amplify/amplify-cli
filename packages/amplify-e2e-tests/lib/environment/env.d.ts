export declare function addEnvironment(cwd: string, settings: {
    envName: string;
    numLayers?: number;
    cloneParams?: boolean;
}): Promise<void>;
export declare function addEnvironmentCarryOverEnvVars(cwd: string, settings: {
    envName: string;
}): Promise<void>;
export declare function updateEnvironment(cwd: string, settings: {
    permissionsBoundaryArn: string;
}): Promise<void>;
export declare function addEnvironmentYes(cwd: string, settings: {
    envName: string;
    disableAmplifyAppCreation?: boolean;
}): Promise<void>;
export declare function addEnvironmentWithImportedAuth(cwd: string, settings: {
    envName: string;
    currentEnvName: string;
}): Promise<void>;
export declare function checkoutEnvironment(cwd: string, settings: {
    envName: string;
    restoreBackend?: boolean;
}): Promise<void>;
export declare function listEnvironment(cwd: string, settings: {
    numEnv?: number;
}): Promise<void>;
export declare function getEnvironment(cwd: string, settings: {
    envName: string;
}): Promise<string>;
export declare function pullEnvironment(cwd: string): Promise<void>;
export declare function addEnvironmentHostedUI(cwd: string, settings: {
    envName: string;
}): Promise<void>;
export declare function importEnvironment(cwd: string, settings: {
    envName: string;
    providerConfig: string;
}): Promise<void>;
export declare const removeEnvironment: (cwd: string, settings: {
    envName: string;
}) => Promise<void>;
