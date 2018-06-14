/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface InstanceProperties {
    InstanceAttributes: any
    InstanceId?: Value<string>
    ServiceId: Value<string>
}

export default class Instance extends ResourceBase {


    constructor(properties?: InstanceProperties) {
        super('AWS::ServiceDiscovery::Instance', properties)
    }
}
