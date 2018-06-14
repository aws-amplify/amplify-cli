import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Predicate {
    DataId: Value<string>;
    Negated: Value<boolean>;
    Type: Value<string>;
    constructor(properties: Predicate);
}
export interface RuleProperties {
    MetricName: Value<string>;
    Name: Value<string>;
    Predicates?: List<Predicate>;
}
export default class Rule extends ResourceBase {
    static Predicate: typeof Predicate;
    constructor(properties?: RuleProperties);
}
