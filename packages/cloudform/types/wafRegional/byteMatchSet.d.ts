import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class ByteMatchTuple {
    TargetString?: Value<string>;
    TargetStringBase64?: Value<string>;
    PositionalConstraint: Value<string>;
    TextTransformation: Value<string>;
    FieldToMatch: FieldToMatch;
    constructor(properties: ByteMatchTuple);
}
export declare class FieldToMatch {
    Type: Value<string>;
    Data?: Value<string>;
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
