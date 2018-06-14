/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ThreatIntelSetProperties {
    Format: Value<string>
    Activate: Value<boolean>
    DetectorId: Value<string>
    Name?: Value<string>
    Location: Value<string>
}

export default class ThreatIntelSet extends ResourceBase {


    constructor(properties?: ThreatIntelSetProperties) {
        super('AWS::GuardDuty::ThreatIntelSet', properties)
    }
}
