import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class ProvisioningParameter {
    Value?: Value<string>;
    Key?: Value<string>;
    constructor(properties: ProvisioningParameter);
}
export interface CloudFormationProvisionedProductProperties {
    PathId?: Value<string>;
    ProvisioningParameters?: List<ProvisioningParameter>;
    ProductName?: Value<string>;
    ProvisioningArtifactName?: Value<string>;
    NotificationArns?: List<Value<string>>;
    AcceptLanguage?: Value<string>;
    ProductId?: Value<string>;
    Tags?: ResourceTag[];
    ProvisionedProductName?: Value<string>;
    ProvisioningArtifactId?: Value<string>;
}
export default class CloudFormationProvisionedProduct extends ResourceBase {
    static ProvisioningParameter: typeof ProvisioningParameter;
    constructor(properties?: CloudFormationProvisionedProductProperties);
}
