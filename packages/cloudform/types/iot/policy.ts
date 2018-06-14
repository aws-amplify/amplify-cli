/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface PolicyProperties {
    PolicyDocument: any
    PolicyName?: Value<string>
}

export default class Policy extends ResourceBase {


    constructor(properties?: PolicyProperties) {
        super('AWS::IoT::Policy', properties)
    }
}
