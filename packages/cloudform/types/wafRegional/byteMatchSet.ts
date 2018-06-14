/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ByteMatchTuple {
    TargetString?: Value<string>
    TargetStringBase64?: Value<string>
    PositionalConstraint: Value<string>
    TextTransformation: Value<string>
    FieldToMatch: FieldToMatch

    constructor(properties: ByteMatchTuple) {
        Object.assign(this, properties)
    }
}

export class FieldToMatch {
    Type: Value<string>
    Data?: Value<string>

    constructor(properties: FieldToMatch) {
        Object.assign(this, properties)
    }
}

export interface ByteMatchSetProperties {
    ByteMatchTuples?: List<ByteMatchTuple>
    Name: Value<string>
}

export default class ByteMatchSet extends ResourceBase {
    static ByteMatchTuple = ByteMatchTuple
    static FieldToMatch = FieldToMatch

    constructor(properties?: ByteMatchSetProperties) {
        super('AWS::WAFRegional::ByteMatchSet', properties)
    }
}
