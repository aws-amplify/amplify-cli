/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface UsagePlanKeyProperties {
    KeyId: Value<string>
    KeyType: Value<string>
    UsagePlanId: Value<string>
}

export default class UsagePlanKey extends ResourceBase {


    constructor(properties?: UsagePlanKeyProperties) {
        super('AWS::ApiGateway::UsagePlanKey', properties)
    }
}
