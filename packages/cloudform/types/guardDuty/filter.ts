/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class FindingCriteria {
    Criterion?: any
    ItemType?: Condition

    constructor(properties: FindingCriteria) {
        Object.assign(this, properties)
    }
}

export class Condition {
    Lt?: Value<number>
    Gte?: Value<number>
    Neq?: List<Value<string>>
    Eq?: List<Value<string>>
    Lte?: Value<number>

    constructor(properties: Condition) {
        Object.assign(this, properties)
    }
}

export interface FilterProperties {
    Action: Value<string>
    Description: Value<string>
    DetectorId: Value<string>
    FindingCriteria: FindingCriteria
    Rank: Value<number>
    Name?: Value<string>
}

export default class Filter extends ResourceBase {
    static FindingCriteria = FindingCriteria
    static Condition = Condition

    constructor(properties?: FilterProperties) {
        super('AWS::GuardDuty::Filter', properties)
    }
}
