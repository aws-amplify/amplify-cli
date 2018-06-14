/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class SizeConstraint {
    ComparisonOperator: Value<string>
    Size: Value<number>
    TextTransformation: Value<string>
    FieldToMatch: FieldToMatch

    constructor(properties: SizeConstraint) {
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

export interface SizeConstraintSetProperties {
    SizeConstraints?: List<SizeConstraint>
    Name: Value<string>
}

export default class SizeConstraintSet extends ResourceBase {
    static SizeConstraint = SizeConstraint
    static FieldToMatch = FieldToMatch

    constructor(properties?: SizeConstraintSetProperties) {
        super('AWS::WAFRegional::SizeConstraintSet', properties)
    }
}
