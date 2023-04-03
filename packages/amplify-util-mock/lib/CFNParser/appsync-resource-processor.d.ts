import { AmplifyAppSyncSimulatorConfig } from '@aws-amplify/amplify-appsync-simulator';
import { $TSAny } from 'amplify-cli-core';
export declare function processApiResources(resources: Record<string, {
    Type: string;
    result: any;
}>, transformResult: any, appSyncConfig: AmplifyAppSyncSimulatorConfig): void;
export declare function processCloudFormationResults(resources: any, transformResult: any): AmplifyAppSyncSimulatorConfig;
export declare function processTransformerStacks(transformResult: any, params?: {}): AmplifyAppSyncSimulatorConfig;
export declare function configureSearchEnabledTables(transformResult: $TSAny, processedResources: AmplifyAppSyncSimulatorConfig): AmplifyAppSyncSimulatorConfig;
export declare function searchableModelExists(transformResult: $TSAny): boolean;
//# sourceMappingURL=appsync-resource-processor.d.ts.map