import { $TSAny, $TSContext } from 'amplify-cli-core';
export declare function removeTrigger(context: $TSContext, resourceName: string, triggerFunctionName: string): Promise<void>;
export declare function addTrigger(context: $TSContext, resourceName: string, triggerFunction: $TSAny, adminTriggerFunction: $TSAny, options: {
    dependsOn?: $TSAny[];
    headlessTrigger?: {
        name: string;
        mode: 'new' | 'existing';
    };
}): Promise<string>;
//# sourceMappingURL=s3-trigger-helpers.d.ts.map