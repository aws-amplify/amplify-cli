import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class FieldToMatch {
    Data?: Value<string>;
    Type: Value<string>;
    constructor(properties: FieldToMatch);
}
export declare class SizeConstraint {
    ComparisonOperator: Value<string>;
    FieldToMatch: FieldToMatch;
    Size: Value<number>;
    TextTransformation: Value<string>;
    constructor(properties: SizeConstraint);
}
export interface SizeConstraintSetProperties {
    Name: Value<string>;
    SizeConstraints: List<SizeConstraint>;
}
export default class SizeConstraintSet extends ResourceBase {
    static FieldToMatch: typeof FieldToMatch;
    static SizeConstraint: typeof SizeConstraint;
    constructor(properties?: SizeConstraintSetProperties);
}
