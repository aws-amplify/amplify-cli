/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class EndpointConfiguration {
    Types?: List<Value<string>>

    constructor(properties: EndpointConfiguration) {
        Object.assign(this, properties)
    }
}

export interface DomainNameProperties {
    CertificateArn?: Value<string>
    DomainName: Value<string>
    EndpointConfiguration?: EndpointConfiguration
    RegionalCertificateArn?: Value<string>
}

export default class DomainName extends ResourceBase {
    static EndpointConfiguration = EndpointConfiguration

    constructor(properties?: DomainNameProperties) {
        super('AWS::ApiGateway::DomainName', properties)
    }
}
