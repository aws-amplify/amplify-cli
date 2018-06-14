import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Action {
    JobName?: Value<string>;
    Arguments?: any;
    constructor(properties: Action);
}
export declare class Condition {
    State?: Value<string>;
    LogicalOperator?: Value<string>;
    JobName?: Value<string>;
    constructor(properties: Condition);
}
export declare class Predicate {
    Logical?: Value<string>;
    Conditions?: List<Condition>;
    constructor(properties: Predicate);
}
export interface TriggerProperties {
    Type: Value<string>;
    Description?: Value<string>;
    Actions: List<Action>;
    Schedule?: Value<string>;
    Name?: Value<string>;
    Predicate?: Predicate;
}
export default class Trigger extends ResourceBase {
    static Action: typeof Action;
    static Condition: typeof Condition;
    static Predicate: typeof Predicate;
    constructor(properties?: TriggerProperties);
}
