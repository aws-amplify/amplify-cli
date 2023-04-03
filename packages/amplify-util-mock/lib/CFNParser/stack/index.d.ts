import '../../CFNParser';
import { CloudFormationParseContext } from '../types';
import { CloudFormationConditions, CloudFormationOutputs, CloudFormationParameters, CloudFormationResource, CloudFormationResources, CloudFormationTemplate, CloudFormationTemplateFetcher } from './types';
export declare const CFN_PSEUDO_PARAMS: {
    'AWS::Region': string;
    'AWS::AccountId': string;
    'AWS::StackId': string;
    'AWS::StackName': string;
    'AWS::URLSuffix': string;
};
export declare function nestedStackHandler(resourceName: string, resource: CloudFormationResource, cfnContext: CloudFormationParseContext, cfnTemplateFetcher: CloudFormationTemplateFetcher): {
    resources: Record<string, any>;
    stackExports: Record<string, any>;
    outputs: Record<string, any>;
};
export declare function mergeParameters(templateParameters: CloudFormationParameters, inputParameters: any): Record<string, any>;
export declare function processConditions(conditions: CloudFormationConditions, processedParams: Record<string, any>): Record<string, boolean>;
export declare function getDependencyResources(node: object | any[], params?: Record<string, any>): string[];
export declare function sortResources(resources: CloudFormationResources, params: Record<string, any>): string[];
export declare function filterResourcesBasedOnConditions(resources: CloudFormationResources, conditions: Record<string, boolean>): CloudFormationResources;
export declare function processResources(parameters: Record<string, any>, conditions: Record<string, boolean>, resources: CloudFormationResources, cfnExports: Record<string, any>, cfnTemplateFetcher: CloudFormationTemplateFetcher): {
    resources: Record<string, any>;
    stackExports: Record<string, any>;
};
export declare function processExports(output: CloudFormationOutputs, parameters: Record<string, any>, conditions: Record<string, boolean>, resources: Record<string, any>, cfnExports?: Record<string, any>): Record<string, any>;
export declare function processOutputs(output: CloudFormationOutputs, parameters: Record<string, any>, conditions: Record<string, boolean>, resources: Record<string, any>, cfnExports?: Record<string, any>): Record<string, any>;
export declare function processCloudFormationStack(template: CloudFormationTemplate, parameters: Record<string, any>, cfnExports: Record<string, any>, cfnTemplateFetcher: CloudFormationTemplateFetcher): {
    resources: Record<string, any>;
    stackExports: Record<string, any>;
    outputs: Record<string, any>;
};
//# sourceMappingURL=index.d.ts.map