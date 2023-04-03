export declare const secretsPathAmplifyAppIdKey = "secretsPathAmplifyAppId";
export declare const getFullyQualifiedSecretName: (secretName: string, functionName: string, envName?: string) => string;
export declare const getFunctionSecretPrefix: (functionName: string, envName?: string) => string;
export declare const getEnvSecretPrefix: (envName?: string) => string;
export declare const getFunctionSecretCfnName: (secretName: string, functionName: string) => import("cloudform-types").IntrinsicFunction;
export declare const getFunctionSecretCfnPrefix: (functionName: string) => import("cloudform-types").IntrinsicFunction;
export declare const getAppId: () => any;
//# sourceMappingURL=secretName.d.ts.map