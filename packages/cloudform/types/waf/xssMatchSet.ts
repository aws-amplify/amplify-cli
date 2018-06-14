/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class FieldToMatch {
    Data?: Value<string>
    Type: Value<string>

    constructor(properties: FieldToMatch) {
        Object.assign(this, properties)
    }
}

export class XssMatchTuple {
    FieldToMatch: FieldToMatch
    TextTransformation: Value<string>

    constructor(properties: XssMatchTuple) {
        Object.assign(this, properties)
    }
}

export interface XssMatchSetProperties {
    Name: Value<string>
    XssMatchTuples: List<XssMatchTuple>
}

export default class XssMatchSet extends ResourceBase {
    static FieldToMatch = FieldToMatch
    static XssMatchTuple = XssMatchTuple

    constructor(properties?: XssMatchSetProperties) {
        super('AWS::WAF::XssMatchSet', properties)
    }
}
