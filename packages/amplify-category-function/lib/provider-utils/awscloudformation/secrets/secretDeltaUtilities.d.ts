import { SecretDelta, SecretDeltas } from '@aws-amplify/amplify-function-plugin-interface';
export declare const hasExistingSecrets: (secretDeltas: SecretDeltas) => boolean;
export declare const getExistingSecrets: (secretDeltas: SecretDeltas) => SecretDeltas;
export declare const secretNamesToSecretDeltas: (secretNames: string[], delta?: SecretDelta) => SecretDeltas;
export declare const hasSetSecrets: (secretDeltas: SecretDeltas) => boolean;
//# sourceMappingURL=secretDeltaUtilities.d.ts.map