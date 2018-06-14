/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Rule {
    Action: Action
    Priority: Value<number>
    RuleId: Value<string>

    constructor(properties: Rule) {
        Object.assign(this, properties)
    }
}

export class Action {
    Type: Value<string>

    constructor(properties: Action) {
        Object.assign(this, properties)
    }
}

export interface WebACLProperties {
    MetricName: Value<string>
    DefaultAction: Action
    Rules?: List<Rule>
    Name: Value<string>
}

export default class WebACL extends ResourceBase {
    static Rule = Rule
    static Action = Action

    constructor(properties?: WebACLProperties) {
        super('AWS::WAFRegional::WebACL', properties)
    }
}
