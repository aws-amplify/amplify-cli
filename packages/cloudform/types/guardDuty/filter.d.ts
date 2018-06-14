import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class FindingCriteria {
    Criterion?: any;
    ItemType?: Condition;
    constructor(properties: FindingCriteria);
}
export declare class Condition {
    Lt?: Value<number>;
    Gte?: Value<number>;
    Neq?: List<Value<string>>;
    Eq?: List<Value<string>>;
    Lte?: Value<number>;
    constructor(properties: Condition);
}
export interface FilterProperties {
    Action: Value<string>;
    Description: Value<string>;
    DetectorId: Value<string>;
    FindingCriteria: FindingCriteria;
    Rank: Value<number>;
    Name?: Value<string>;
}
export default class Filter extends ResourceBase {
    static FindingCriteria: typeof FindingCriteria;
    static Condition: typeof Condition;
    constructor(properties?: FilterProperties);
}
