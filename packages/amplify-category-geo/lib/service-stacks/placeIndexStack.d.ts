import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PlaceIndexParameters } from '../service-utils/placeIndexParams';
import { BaseStack, TemplateMappings } from './baseStack';
type PlaceIndexStackProps = Pick<PlaceIndexParameters, 'accessType' | 'groupPermissions'> & TemplateMappings & {
    authResourceName: string;
};
export declare class PlaceIndexStack extends BaseStack {
    private readonly props;
    protected readonly groupPermissions: string[];
    protected readonly accessType: string;
    protected readonly placeIndexResource: cdk.CustomResource;
    protected readonly placeIndexRegion: string;
    protected readonly placeIndexName: string;
    protected readonly authResourceName: string;
    constructor(scope: Construct, id: string, props: PlaceIndexStackProps);
    private constructOutputs;
    private constructIndexResource;
    private constructIndexPolicyResource;
}
export {};
//# sourceMappingURL=placeIndexStack.d.ts.map