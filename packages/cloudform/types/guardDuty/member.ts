/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface MemberProperties {
    Status?: Value<string>
    MemberId: Value<string>
    Email: Value<string>
    Message?: Value<string>
    DisableEmailNotification?: Value<boolean>
    DetectorId: Value<string>
}

export default class Member extends ResourceBase {


    constructor(properties?: MemberProperties) {
        super('AWS::GuardDuty::Member', properties)
    }
}
