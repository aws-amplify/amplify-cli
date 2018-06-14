import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class SizeConstraint {
    ComparisonOperator: Value<string>;
    Size: Value<number>;
    TextTransformation: Value<string>;
    FieldToMatch: FieldToMatch;
    constructor(properties: SizeConstraint);
}
export declare class FieldToMatch {
    Type: Value<string>;
    Data?: Value<string>;
    constructor(properties: FieldToMatch);
}
export interface SizeConstraintSetProperties {
    SizeConstraints?: List<SizeConstraint>;
    Name: Value<string>;
}
export default class SizeConstraintSet extends ResourceBase {
    static SizeConstraint: typeof SizeConstraint;
    static FieldToMatch: typeof FieldToMatch;
    constructor(properties?: SizeConstraintSetProperties);
}
