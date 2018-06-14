import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class ProvisioningArtifactProperties {
    Description?: Value<string>;
    Info: any;
    Name?: Value<string>;
    constructor(properties: ProvisioningArtifactProperties);
}
export interface CloudFormationProductProperties {
    Owner: Value<string>;
    SupportDescription?: Value<string>;
    Description?: Value<string>;
    Distributor?: Value<string>;
    SupportEmail?: Value<string>;
    AcceptLanguage?: Value<string>;
    SupportUrl?: Value<string>;
    Tags?: ResourceTag[];
    Name: Value<string>;
    ProvisioningArtifactParameters: List<ProvisioningArtifactProperties>;
}
export default class CloudFormationProduct extends ResourceBase {
    static ProvisioningArtifactProperties: typeof ProvisioningArtifactProperties;
    constructor(properties?: CloudFormationProductProperties);
}
