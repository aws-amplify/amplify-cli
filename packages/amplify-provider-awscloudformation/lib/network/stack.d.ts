import * as cdk from 'aws-cdk-lib';
import { $TSAny } from 'amplify-cli-core';
import { Construct } from 'constructs';
export declare const RESOURCE_TAG = "amplify-env";
type NetworkStackProps = Readonly<{
    stackName: string;
    vpcName: string;
    vpcId: string;
    internetGatewayId: string;
    subnetCidrs: ReadonlyMap<string, string>;
}>;
export declare const NETWORK_STACK_LOGICAL_ID = "NetworkStack";
export declare class NetworkStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: NetworkStackProps);
    toCloudFormation: () => $TSAny;
}
export {};
//# sourceMappingURL=stack.d.ts.map