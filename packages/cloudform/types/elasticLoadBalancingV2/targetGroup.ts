/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class TargetGroupAttribute {
    Key?: Value<string>
    Value?: Value<string>

    constructor(properties: TargetGroupAttribute) {
        Object.assign(this, properties)
    }
}

export class Matcher {
    HttpCode: Value<string>

    constructor(properties: Matcher) {
        Object.assign(this, properties)
    }
}

export class TargetDescription {
    AvailabilityZone?: Value<string>
    Id: Value<string>
    Port?: Value<number>

    constructor(properties: TargetDescription) {
        Object.assign(this, properties)
    }
}

export interface TargetGroupProperties {
    HealthCheckIntervalSeconds?: Value<number>
    HealthCheckPath?: Value<string>
    HealthCheckPort?: Value<string>
    HealthCheckProtocol?: Value<string>
    HealthCheckTimeoutSeconds?: Value<number>
    HealthyThresholdCount?: Value<number>
    Matcher?: Matcher
    Name?: Value<string>
    Port: Value<number>
    Protocol: Value<string>
    Tags?: ResourceTag[]
    TargetGroupAttributes?: List<TargetGroupAttribute>
    TargetType?: Value<string>
    Targets?: List<TargetDescription>
    UnhealthyThresholdCount?: Value<number>
    VpcId: Value<string>
}

export default class TargetGroup extends ResourceBase {
    static TargetGroupAttribute = TargetGroupAttribute
    static Matcher = Matcher
    static TargetDescription = TargetDescription

    constructor(properties?: TargetGroupProperties) {
        super('AWS::ElasticLoadBalancingV2::TargetGroup', properties)
    }
}
