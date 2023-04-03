import { ResourceName } from 'amplify-cli-core';
import { FunctionParameters, SecretDeltas } from '@aws-amplify/amplify-function-plugin-interface';
declare const secretValuesWalkthroughDefaultOptions: {
    preConfirmed: boolean;
};
export declare const secretValuesWalkthrough: (secretDeltas: SecretDeltas, envVarNames?: string[], options?: Partial<typeof secretValuesWalkthroughDefaultOptions>) => Promise<Pick<FunctionParameters, 'secretDeltas'>>;
export declare const prePushMissingSecretsWalkthrough: (functionName: string, missingSecretNames: string[]) => Promise<SecretDeltas>;
export declare const cloneEnvWalkthrough: (interactive?: boolean, deltas?: Record<ResourceName, SecretDeltas>) => Promise<Record<ResourceName, SecretDeltas>>;
export declare const secretValueValidator: (input?: string) => true | "Secret value must be between 1 and 2048 characters long";
export {};
//# sourceMappingURL=secretValuesWalkthrough.d.ts.map