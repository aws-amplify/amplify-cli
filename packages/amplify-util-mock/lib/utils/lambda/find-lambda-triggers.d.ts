import { $TSContext, $TSObject } from 'amplify-cli-core';
type LambdaTriggersMap = {
    [index: string]: LambdaTrigger[];
};
export type LambdaTrigger = {
    name?: string;
    config?: LambdaTriggerConfig;
};
export type LambdaTriggerConfig = {
    handler: string;
    runtimePluginId: string;
    runtime: string;
    directory: string;
    envVars: $TSObject;
    reBuild: boolean;
};
export declare const findModelLambdaTriggers: (context: $TSContext, tables: string[]) => Promise<LambdaTriggersMap>;
export declare const findSearchableLambdaTriggers: (context: $TSContext, tables: string[], opensearchEndpoint?: URL) => Promise<{
    [index: string]: LambdaTrigger;
}>;
export declare const getSearchableLambdaTriggerConfig: (context: $TSContext, opensearchEndpoint: URL, tableName?: string) => LambdaTriggerConfig;
export {};
//# sourceMappingURL=find-lambda-triggers.d.ts.map