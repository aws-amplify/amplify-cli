import { $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';
import Separator from 'inquirer/lib/objects/separator';
export declare const addTrigger: (triggerOptions: any) => Promise<{}>;
export declare const updateTrigger: (triggerOptions: any) => Promise<null | undefined>;
export declare const deleteDeselectedTriggers: (currentTriggers: any, previousTriggers: any, functionName: any, targetDir: any, context: any) => Promise<void>;
export declare const deleteTrigger: (context: $TSContext, name: string, dir: string) => Promise<void>;
export declare const deleteAllTriggers: (triggers: $TSObject, functionName: string, dir: string, context: $TSContext) => Promise<void>;
export declare const triggerFlow: (context: any, resource: any, category: any, previousTriggers?: {}) => Promise<Record<string, any> | null>;
export declare const getTriggerPermissions: (context: any, triggers: any, category: any) => Promise<string[]>;
export declare const choicesFromMetadata: (triggerPath: string, selection: any, isDir?: any) => (string | Separator | {
    name: any;
    value: any;
})[];
export declare const getTriggerMetadata: (triggerPath: any, selection: any) => $TSAny;
export declare const copyFunctions: (key: any, value: any, category: any, context: any, targetPath: any) => Promise<void>;
export declare const cleanFunctions: (key: any, values: any, category: any, context: any, targetPath: any) => Promise<null>;
export declare const getTriggerEnvVariables: (context: any, trigger: any, category: any) => never[] | null;
export declare const getTriggerEnvInputs: (context: any, triggerPath: any, triggerKey: any, triggerValues: any, currentEnvVars: any) => Promise<any>;
export declare const dependsOnBlock: (context: any, triggerKeys: any, provider: any) => unknown[];
//# sourceMappingURL=trigger-flow.d.ts.map