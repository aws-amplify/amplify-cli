/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class InstanceAssociationOutputLocation {
    S3Location?: S3OutputLocation

    constructor(properties: InstanceAssociationOutputLocation) {
        Object.assign(this, properties)
    }
}

export class Target {
    Key: Value<string>
    Values: List<Value<string>>

    constructor(properties: Target) {
        Object.assign(this, properties)
    }
}

export class ParameterValues {
    ParameterValues: List<Value<string>>

    constructor(properties: ParameterValues) {
        Object.assign(this, properties)
    }
}

export class S3OutputLocation {
    OutputS3BucketName?: Value<string>
    OutputS3KeyPrefix?: Value<string>

    constructor(properties: S3OutputLocation) {
        Object.assign(this, properties)
    }
}

export interface AssociationProperties {
    AssociationName?: Value<string>
    DocumentVersion?: Value<string>
    InstanceId?: Value<string>
    Name: Value<string>
    OutputLocation?: InstanceAssociationOutputLocation
    Parameters?: {[key: string]: ParameterValues}
    ScheduleExpression?: Value<string>
    Targets?: List<Target>
}

export default class Association extends ResourceBase {
    static InstanceAssociationOutputLocation = InstanceAssociationOutputLocation
    static Target = Target
    static ParameterValues = ParameterValues
    static S3OutputLocation = S3OutputLocation

    constructor(properties?: AssociationProperties) {
        super('AWS::SSM::Association', properties)
    }
}
