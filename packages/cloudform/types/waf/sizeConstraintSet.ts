/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class FieldToMatch {
    Data?: Value<string>
    Type: Value<string>

    constructor(properties: FieldToMatch) {
        Object.assign(this, properties)
    }
}

export class SizeConstraint {
    ComparisonOperator: Value<string>
    FieldToMatch: FieldToMatch
    Size: Value<number>
    TextTransformation: Value<string>

    constructor(properties: SizeConstraint) {
        Object.assign(this, properties)
    }
}

export interface SizeConstraintSetProperties {
    Name: Value<string>
    SizeConstraints: List<SizeConstraint>
}

export default class SizeConstraintSet extends ResourceBase {
    static FieldToMatch = FieldToMatch
    static SizeConstraint = SizeConstraint

    constructor(properties?: SizeConstraintSetProperties) {
        super('AWS::WAF::SizeConstraintSet', properties)
    }
}
