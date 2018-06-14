/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface MasterProperties {
    DetectorId: Value<string>
    MasterId: Value<string>
    InvitationId?: Value<string>
}

export default class Master extends ResourceBase {


    constructor(properties?: MasterProperties) {
        super('AWS::GuardDuty::Master', properties)
    }
}
