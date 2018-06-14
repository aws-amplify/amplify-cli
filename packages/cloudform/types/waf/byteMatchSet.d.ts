import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class ByteMatchTuple {
    FieldToMatch: FieldToMatch;
    PositionalConstraint: Value<string>;
    TargetString?: Value<string>;
    TargetStringBase64?: Value<string>;
    TextTransformation: Value<string>;
    constructor(properties: ByteMatchTuple);
}
export declare class FieldToMatch {
    Data?: Value<string>;
    Type: Value<string>;
    constructor(properties: FieldToMatch);
}
export interface ByteMatchSetProperties {
    ByteMatchTuples?: List<ByteMatchTuple>;
    Name: Value<string>;
}
export default class ByteMatchSet extends ResourceBase {
    static ByteMatchTuple: typeof ByteMatchTuple;
    static FieldToMatch: typeof FieldToMatch;
    constructor(properties?: ByteMatchSetProperties);
}
