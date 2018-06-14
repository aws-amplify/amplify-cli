/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Predicate {
    Type: Value<string>
    DataId: Value<string>
    Negated: Value<boolean>

    constructor(properties: Predicate) {
        Object.assign(this, properties)
    }
}

export interface RuleProperties {
    MetricName: Value<string>
    Predicates?: List<Predicate>
    Name: Value<string>
}

export default class Rule extends ResourceBase {
    static Predicate = Predicate

    constructor(properties?: RuleProperties) {
        super('AWS::WAFRegional::Rule', properties)
    }
}
