/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface HostProperties {
    AutoPlacement?: Value<string>
    AvailabilityZone: Value<string>
    InstanceType: Value<string>
}

export default class Host extends ResourceBase {


    constructor(properties?: HostProperties) {
        super('AWS::EC2::Host', properties)
    }
}
