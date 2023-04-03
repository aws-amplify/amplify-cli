import { $TSContext } from 'amplify-cli-core';
import { SecretDeltas } from '@aws-amplify/amplify-function-plugin-interface';
export declare class FunctionSecretsStateManager {
    private readonly context;
    private readonly ssmClientWrapper;
    private static instance;
    static getInstance: (context: $TSContext) => Promise<FunctionSecretsStateManager>;
    private constructor();
    syncSecretDeltas: (secretDeltas: SecretDeltas, functionName: string, envName?: string) => Promise<void>;
    ensureNewLocalSecretsSyncedToCloud: (functionName: string) => Promise<void>;
    deleteAllFunctionSecrets: (functionName: string) => Promise<void>;
    syncSecretsPendingRemoval: () => Promise<void>;
    deleteAllEnvironmentSecrets: (envName: string) => Promise<void>;
    getEnvCloneDeltas: (sourceEnv: string, functionName: string) => Promise<SecretDeltas>;
    private getCloudFunctionSecretNames;
    private doRemoveSecretsInCloud;
    private isInteractive;
}
export declare const storeSecretsPendingRemoval: (context: $TSContext, functionNames: string[]) => Promise<void>;
declare const defaultGetFunctionSecretNamesOptions: {
    fromCurrentCloudBackend: boolean;
};
export declare const getLocalFunctionSecretNames: (functionName: string, options?: Partial<typeof defaultGetFunctionSecretNamesOptions>) => string[];
export {};
//# sourceMappingURL=functionSecretsStateManager.d.ts.map