import { $TSContext } from 'amplify-cli-core';
export declare const AUTH_TRIGGER_TEMPLATE = "auth-trigger-cloudformation-template.json";
export declare const AUTH_TRIGGER_STACK = "AuthTriggerCustomLambdaStack";
export declare const uploadAuthTriggerTemplate: (context: $TSContext) => Promise<{
    AuthTriggerTemplateURL: string | undefined;
}>;
//# sourceMappingURL=upload-auth-trigger-template.d.ts.map