import { $TSAny } from 'amplify-cli-core';
import { CloudFormationResource, ProcessedLambdaFunction } from '../stack/types';
import { CloudFormationParseContext } from '../types';
export type CloudFormationResourceProcessorFn = (resourceName: string, resource: CloudFormationResource, cfnContext: CloudFormationParseContext) => ProcessedLambdaFunction | $TSAny;
export declare function getResourceProcessorFor(resourceType: string): CloudFormationResourceProcessorFn;
export declare function registerResourceProcessors(resourceType: string, resourceProcessor: CloudFormationResourceProcessorFn): void;
export declare function registerAppSyncResourceProcessor(): void;
export declare function registerIAMResourceProcessor(): void;
export declare function registerLambdaResourceProcessor(): void;
export declare function registerOpenSearchResourceProcessor(): void;
//# sourceMappingURL=index.d.ts.map