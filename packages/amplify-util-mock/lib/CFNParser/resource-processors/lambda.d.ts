import { CloudFormationParseContext } from '../types';
import { CloudFormationResource, ProcessedLambdaEventSource, ProcessedLambdaFunction } from '../stack/types';
export declare const lambdaFunctionHandler: (resourceName: any, resource: CloudFormationResource, cfnContext: CloudFormationParseContext) => ProcessedLambdaFunction;
export declare const lambdaEventSourceHandler: (resourceName: string, resource: CloudFormationResource, cfnContext: CloudFormationParseContext) => ProcessedLambdaEventSource;
//# sourceMappingURL=lambda.d.ts.map