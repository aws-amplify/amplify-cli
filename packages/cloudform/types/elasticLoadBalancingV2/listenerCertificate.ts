/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Certificate {
    CertificateArn?: Value<string>

    constructor(properties: Certificate) {
        Object.assign(this, properties)
    }
}

export interface ListenerCertificateProperties {
    Certificates: List<Certificate>
    ListenerArn: Value<string>
}

export default class ListenerCertificate extends ResourceBase {
    static Certificate = Certificate

    constructor(properties?: ListenerCertificateProperties) {
        super('AWS::ElasticLoadBalancingV2::ListenerCertificate', properties)
    }
}
