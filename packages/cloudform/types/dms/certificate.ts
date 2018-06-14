/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface CertificateProperties {
    CertificateIdentifier?: Value<string>
    CertificatePem?: Value<string>
    CertificateWallet?: Value<string>
}

export default class Certificate extends ResourceBase {


    constructor(properties?: CertificateProperties) {
        super('AWS::DMS::Certificate', properties)
    }
}
