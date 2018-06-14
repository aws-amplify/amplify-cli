/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface UserToGroupAdditionProperties {
    GroupName: Value<string>
    Users: List<Value<string>>
}

export default class UserToGroupAddition extends ResourceBase {


    constructor(properties?: UserToGroupAdditionProperties) {
        super('AWS::IAM::UserToGroupAddition', properties)
    }
}
