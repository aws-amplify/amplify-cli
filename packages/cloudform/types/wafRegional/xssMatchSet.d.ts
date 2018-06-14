import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class XssMatchTuple {
    TextTransformation: Value<string>;
    FieldToMatch: FieldToMatch;
    constructor(properties: XssMatchTuple);
}
export declare class FieldToMatch {
    Type: Value<string>;
    Data?: Value<string>;
    constructor(properties: FieldToMatch);
}
export interface XssMatchSetProperties {
    XssMatchTuples?: List<XssMatchTuple>;
    Name: Value<string>;
}
export default class XssMatchSet extends ResourceBase {
    static XssMatchTuple: typeof XssMatchTuple;
    static FieldToMatch: typeof FieldToMatch;
    constructor(properties?: XssMatchSetProperties);
}
