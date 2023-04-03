import { $TSContext, $TSObject, $TSAny } from 'amplify-cli-core';
export declare const saveEnvResourceParameters: (__: $TSContext | undefined, category: string, resource: string, parameters?: $TSObject | undefined) => void;
export declare const loadEnvResourceParameters: (__: $TSContext | undefined, category: string, resource: string) => $TSAny;
export declare const removeResourceParameters: (context: $TSContext, category: string, resource: string) => void;
export declare const removeDeploymentSecrets: (__: $TSContext | undefined, category: string, resource: string) => void;
//# sourceMappingURL=envResourceParams.d.ts.map