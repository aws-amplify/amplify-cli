/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface PrivateDnsNamespaceProperties {
    Description?: Value<string>
    Vpc: Value<string>
    Name: Value<string>
}

export default class PrivateDnsNamespace extends ResourceBase {


    constructor(properties?: PrivateDnsNamespaceProperties) {
        super('AWS::ServiceDiscovery::PrivateDnsNamespace', properties)
    }
}
