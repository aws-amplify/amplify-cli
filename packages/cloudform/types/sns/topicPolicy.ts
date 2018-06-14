/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface TopicPolicyProperties {
    PolicyDocument: any
    Topics: List<Value<string>>
}

export default class TopicPolicy extends ResourceBase {


    constructor(properties?: TopicPolicyProperties) {
        super('AWS::SNS::TopicPolicy', properties)
    }
}
