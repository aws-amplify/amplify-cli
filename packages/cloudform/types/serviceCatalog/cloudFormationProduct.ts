/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class ProvisioningArtifactProperties {
    Description?: Value<string>
    Info: any
    Name?: Value<string>

    constructor(properties: ProvisioningArtifactProperties) {
        Object.assign(this, properties)
    }
}

export interface CloudFormationProductProperties {
    Owner: Value<string>
    SupportDescription?: Value<string>
    Description?: Value<string>
    Distributor?: Value<string>
    SupportEmail?: Value<string>
    AcceptLanguage?: Value<string>
    SupportUrl?: Value<string>
    Tags?: ResourceTag[]
    Name: Value<string>
    ProvisioningArtifactParameters: List<ProvisioningArtifactProperties>
}

export default class CloudFormationProduct extends ResourceBase {
    static ProvisioningArtifactProperties = ProvisioningArtifactProperties

    constructor(properties?: CloudFormationProductProperties) {
        super('AWS::ServiceCatalog::CloudFormationProduct', properties)
    }
}
