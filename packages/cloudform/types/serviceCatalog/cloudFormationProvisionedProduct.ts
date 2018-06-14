/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class ProvisioningParameter {
    Value?: Value<string>
    Key?: Value<string>

    constructor(properties: ProvisioningParameter) {
        Object.assign(this, properties)
    }
}

export interface CloudFormationProvisionedProductProperties {
    PathId?: Value<string>
    ProvisioningParameters?: List<ProvisioningParameter>
    ProductName?: Value<string>
    ProvisioningArtifactName?: Value<string>
    NotificationArns?: List<Value<string>>
    AcceptLanguage?: Value<string>
    ProductId?: Value<string>
    Tags?: ResourceTag[]
    ProvisionedProductName?: Value<string>
    ProvisioningArtifactId?: Value<string>
}

export default class CloudFormationProvisionedProduct extends ResourceBase {
    static ProvisioningParameter = ProvisioningParameter

    constructor(properties?: CloudFormationProvisionedProductProperties) {
        super('AWS::ServiceCatalog::CloudFormationProvisionedProduct', properties)
    }
}
