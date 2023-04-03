import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStack, TemplateMappings } from './baseStack';
import { GeofenceCollectionParameters } from '../service-utils/geofenceCollectionParams';
type GeofenceCollectionStackProps = Pick<GeofenceCollectionParameters, 'groupPermissions'> & TemplateMappings & {
    authResourceName: string;
};
export declare class GeofenceCollectionStack extends BaseStack {
    private readonly props;
    protected readonly groupPermissions: Record<string, string[]>;
    protected readonly geofenceCollectionResource: cdk.CustomResource;
    protected readonly geofenceCollectionRegion: string;
    protected readonly geofenceCollectionName: string;
    protected readonly authResourceName: string;
    constructor(scope: Construct, id: string, props: GeofenceCollectionStackProps);
    private constructOutputs;
    private constructCollectionResource;
    private constructCollectionPolicyResources;
}
export {};
//# sourceMappingURL=geofenceCollectionStack.d.ts.map