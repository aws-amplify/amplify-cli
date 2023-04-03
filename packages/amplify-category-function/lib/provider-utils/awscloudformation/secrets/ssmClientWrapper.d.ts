import { $TSContext } from 'amplify-cli-core';
export declare class SSMClientWrapper {
    private readonly ssmClient;
    private static instance;
    static getInstance: (context: $TSContext) => Promise<SSMClientWrapper>;
    private constructor();
    getSecrets: (secretNames: string[]) => Promise<{
        secretName?: string;
        secretValue?: string;
    }[] | undefined>;
    getSecretNamesByPath: (secretPath: string) => Promise<string[]>;
    setSecret: (secretName: string, secretValue: string) => Promise<void>;
    deleteSecret: (secretName: string) => Promise<void>;
    deleteSecrets: (secretNames: string[]) => Promise<void>;
}
//# sourceMappingURL=ssmClientWrapper.d.ts.map