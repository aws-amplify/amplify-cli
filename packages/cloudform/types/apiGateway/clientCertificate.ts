/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ClientCertificateProperties {
    Description?: Value<string>
}

export default class ClientCertificate extends ResourceBase {


    constructor(properties?: ClientCertificateProperties) {
        super('AWS::ApiGateway::ClientCertificate', properties)
    }
}
