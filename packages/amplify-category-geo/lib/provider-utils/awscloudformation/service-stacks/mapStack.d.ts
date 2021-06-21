import * as cdk from '@aws-cdk/core';
import { MapParameters } from '../utils/mapParams';
export declare class MapStack extends cdk.Stack {
    private readonly props;
    protected readonly parameters: ReadonlyMap<string, cdk.CfnParameter>;
    protected readonly resources: ReadonlyMap<string, cdk.CfnResource>;
    protected readonly mapName: string;
    protected readonly mapStyle: string;
    protected readonly pricingPlan: string;
    protected readonly accessType: string;
    constructor(scope: cdk.Construct, id: string, props: MapParameters);
    private constructInputParameters;
    private constructResources;
    private constructMapResource;
    toCloudFormation(): any;
    private constructMapPolicyResource;
}
//# sourceMappingURL=mapStack.d.ts.map