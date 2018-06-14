/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface PublicDnsNamespaceProperties {
    Description?: Value<string>
    Name: Value<string>
}

export default class PublicDnsNamespace extends ResourceBase {


    constructor(properties?: PublicDnsNamespaceProperties) {
        super('AWS::ServiceDiscovery::PublicDnsNamespace', properties)
    }
}
