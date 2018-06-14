import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class FieldToMatch {
    Data?: Value<string>;
    Type: Value<string>;
    constructor(properties: FieldToMatch);
}
export declare class XssMatchTuple {
    FieldToMatch: FieldToMatch;
    TextTransformation: Value<string>;
    constructor(properties: XssMatchTuple);
}
export interface XssMatchSetProperties {
    Name: Value<string>;
    XssMatchTuples: List<XssMatchTuple>;
}
export default class XssMatchSet extends ResourceBase {
    static FieldToMatch: typeof FieldToMatch;
    static XssMatchTuple: typeof XssMatchTuple;
    constructor(properties?: XssMatchSetProperties);
}
