/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface EIPProperties {
    Domain?: Value<string>
    InstanceId?: Value<string>
}

export default class EIP extends ResourceBase {


    constructor(properties?: EIPProperties) {
        super('AWS::EC2::EIP', properties)
    }
}
