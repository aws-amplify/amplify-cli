import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class SqlInjectionMatchTuple {
    FieldToMatch: FieldToMatch;
    TextTransformation: Value<string>;
    constructor(properties: SqlInjectionMatchTuple);
}
export declare class FieldToMatch {
    Data?: Value<string>;
    Type: Value<string>;
    constructor(properties: FieldToMatch);
}
export interface SqlInjectionMatchSetProperties {
    Name: Value<string>;
    SqlInjectionMatchTuples?: List<SqlInjectionMatchTuple>;
}
export default class SqlInjectionMatchSet extends ResourceBase {
    static SqlInjectionMatchTuple: typeof SqlInjectionMatchTuple;
    static FieldToMatch: typeof FieldToMatch;
    constructor(properties?: SqlInjectionMatchSetProperties);
}
