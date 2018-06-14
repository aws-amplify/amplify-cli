/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Predicate {
    DataId: Value<string>
    Negated: Value<boolean>
    Type: Value<string>

    constructor(properties: Predicate) {
        Object.assign(this, properties)
    }
}

export interface RuleProperties {
    MetricName: Value<string>
    Name: Value<string>
    Predicates?: List<Predicate>
}

export default class Rule extends ResourceBase {
    static Predicate = Predicate

    constructor(properties?: RuleProperties) {
        super('AWS::WAF::Rule', properties)
    }
}
