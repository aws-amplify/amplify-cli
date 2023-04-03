import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MapParameters } from '../service-utils/mapParams';
import { BaseStack, TemplateMappings } from './baseStack';
type MapStackProps = Pick<MapParameters, 'accessType' | 'groupPermissions'> & TemplateMappings & {
    authResourceName: string;
};
export declare class MapStack extends BaseStack {
    private readonly props;
    protected readonly groupPermissions: string[];
    protected readonly accessType: string;
    protected readonly mapResource: cdk.CustomResource;
    protected readonly mapRegion: string;
    protected readonly mapName: string;
    protected readonly authResourceName: string;
    constructor(scope: Construct, id: string, props: MapStackProps);
    private constructOutputs;
    private constructMapResource;
    private constructMapPolicyResource;
}
export {};
//# sourceMappingURL=mapStack.d.ts.map