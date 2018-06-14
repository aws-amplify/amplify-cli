/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface WaitConditionProperties {
    Count?: Value<number>
    Handle: Value<string>
    Timeout: Value<string>
}

export default class WaitCondition extends ResourceBase {


    constructor(properties?: WaitConditionProperties) {
        super('AWS::CloudFormation::WaitCondition', properties)
    }
}
