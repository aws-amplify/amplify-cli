import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Action {
    TargetGroupArn: Value<string>;
    Type: Value<string>;
    constructor(properties: Action);
}
export declare class RuleCondition {
    Field?: Value<string>;
    Values?: List<Value<string>>;
    constructor(properties: RuleCondition);
}
export interface ListenerRuleProperties {
    Actions: List<Action>;
    Conditions: List<RuleCondition>;
    ListenerArn: Value<string>;
    Priority: Value<number>;
}
export default class ListenerRule extends ResourceBase {
    static Action: typeof Action;
    static RuleCondition: typeof RuleCondition;
    constructor(properties?: ListenerRuleProperties);
}
