/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class FieldToMatch {
    Type: Value<string>
    Data?: Value<string>

    constructor(properties: FieldToMatch) {
        Object.assign(this, properties)
    }
}

export class SqlInjectionMatchTuple {
    TextTransformation: Value<string>
    FieldToMatch: FieldToMatch

    constructor(properties: SqlInjectionMatchTuple) {
        Object.assign(this, properties)
    }
}

export interface SqlInjectionMatchSetProperties {
    SqlInjectionMatchTuples?: List<SqlInjectionMatchTuple>
    Name: Value<string>
}

export default class SqlInjectionMatchSet extends ResourceBase {
    static FieldToMatch = FieldToMatch
    static SqlInjectionMatchTuple = SqlInjectionMatchTuple

    constructor(properties?: SqlInjectionMatchSetProperties) {
        super('AWS::WAFRegional::SqlInjectionMatchSet', properties)
    }
}
