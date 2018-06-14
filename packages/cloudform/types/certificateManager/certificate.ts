/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class DomainValidationOption {
    DomainName: Value<string>
    ValidationDomain: Value<string>

    constructor(properties: DomainValidationOption) {
        Object.assign(this, properties)
    }
}

export interface CertificateProperties {
    DomainName: Value<string>
    DomainValidationOptions?: List<DomainValidationOption>
    SubjectAlternativeNames?: List<Value<string>>
    Tags?: ResourceTag[]
}

export default class Certificate extends ResourceBase {
    static DomainValidationOption = DomainValidationOption

    constructor(properties?: CertificateProperties) {
        super('AWS::CertificateManager::Certificate', properties)
    }
}
