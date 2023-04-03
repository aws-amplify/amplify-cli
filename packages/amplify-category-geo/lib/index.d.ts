import { $TSContext, $TSObject, $TSAny } from '@aws-amplify/amplify-cli-core';
export declare const executeAmplifyCommand: (context: $TSContext) => Promise<void>;
export declare const handleAmplifyEvent: (context: $TSContext, args: $TSAny) => Promise<void>;
export declare const getPermissionPolicies: (context: $TSContext, resourceOpsMapping: $TSObject) => {
    permissionPolicies: $TSObject[];
    resourceAttributes: $TSObject[];
};
export declare const executeAmplifyHeadlessCommand: (context: $TSContext, headlessPayload: string) => Promise<void>;
//# sourceMappingURL=index.d.ts.map