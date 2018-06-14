/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class SqlInjectionMatchTuple {
    FieldToMatch: FieldToMatch
    TextTransformation: Value<string>

    constructor(properties: SqlInjectionMatchTuple) {
        Object.assign(this, properties)
    }
}

export class FieldToMatch {
    Data?: Value<string>
    Type: Value<string>

    constructor(properties: FieldToMatch) {
        Object.assign(this, properties)
    }
}

export interface SqlInjectionMatchSetProperties {
    Name: Value<string>
    SqlInjectionMatchTuples?: List<SqlInjectionMatchTuple>
}

export default class SqlInjectionMatchSet extends ResourceBase {
    static SqlInjectionMatchTuple = SqlInjectionMatchTuple
    static FieldToMatch = FieldToMatch

    constructor(properties?: SqlInjectionMatchSetProperties) {
        super('AWS::WAF::SqlInjectionMatchSet', properties)
    }
}
