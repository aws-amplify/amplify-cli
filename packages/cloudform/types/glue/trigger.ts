/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Action {
    JobName?: Value<string>
    Arguments?: any

    constructor(properties: Action) {
        Object.assign(this, properties)
    }
}

export class Condition {
    State?: Value<string>
    LogicalOperator?: Value<string>
    JobName?: Value<string>

    constructor(properties: Condition) {
        Object.assign(this, properties)
    }
}

export class Predicate {
    Logical?: Value<string>
    Conditions?: List<Condition>

    constructor(properties: Predicate) {
        Object.assign(this, properties)
    }
}

export interface TriggerProperties {
    Type: Value<string>
    Description?: Value<string>
    Actions: List<Action>
    Schedule?: Value<string>
    Name?: Value<string>
    Predicate?: Predicate
}

export default class Trigger extends ResourceBase {
    static Action = Action
    static Condition = Condition
    static Predicate = Predicate

    constructor(properties?: TriggerProperties) {
        super('AWS::Glue::Trigger', properties)
    }
}
