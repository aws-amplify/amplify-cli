/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface PolicyProperties {
    Groups?: List<Value<string>>
    PolicyDocument: any
    PolicyName: Value<string>
    Roles?: List<Value<string>>
    Users?: List<Value<string>>
}

export default class Policy extends ResourceBase {


    constructor(properties?: PolicyProperties) {
        super('AWS::IAM::Policy', properties)
    }
}
