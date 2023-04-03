import { $TSAny, $TSObject } from '@aws-amplify/amplify-cli-core';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export type TemplateMappings = {
    RegionMapping: $TSObject;
};
export declare class BaseStack extends cdk.Stack {
    protected parameters: Map<string, cdk.CfnParameter>;
    protected regionMapping: cdk.CfnMapping;
    constructor(scope: Construct, id: string, props: TemplateMappings);
    constructInputParameters(parameterNames: Array<string>): Map<string, cdk.CfnParameter>;
    toCloudFormation: () => $TSAny;
}
//# sourceMappingURL=baseStack.d.ts.map