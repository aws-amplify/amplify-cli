import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Predicate {
    Type: Value<string>;
    DataId: Value<string>;
    Negated: Value<boolean>;
    constructor(properties: Predicate);
}
export interface RuleProperties {
    MetricName: Value<string>;
    Predicates?: List<Predicate>;
    Name: Value<string>;
}
export default class Rule extends ResourceBase {
    static Predicate: typeof Predicate;
    constructor(properties?: RuleProperties);
}
