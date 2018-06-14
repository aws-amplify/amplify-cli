/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class StepScalingPolicyConfiguration {
    AdjustmentType?: Value<string>
    Cooldown?: Value<number>
    MetricAggregationType?: Value<string>
    MinAdjustmentMagnitude?: Value<number>
    StepAdjustments?: List<StepAdjustment>

    constructor(properties: StepScalingPolicyConfiguration) {
        Object.assign(this, properties)
    }
}

export class MetricDimension {
    Name: Value<string>
    Value: Value<string>

    constructor(properties: MetricDimension) {
        Object.assign(this, properties)
    }
}

export class StepAdjustment {
    MetricIntervalLowerBound?: Value<number>
    MetricIntervalUpperBound?: Value<number>
    ScalingAdjustment: Value<number>

    constructor(properties: StepAdjustment) {
        Object.assign(this, properties)
    }
}

export class PredefinedMetricSpecification {
    PredefinedMetricType: Value<string>
    ResourceLabel?: Value<string>

    constructor(properties: PredefinedMetricSpecification) {
        Object.assign(this, properties)
    }
}

export class CustomizedMetricSpecification {
    Dimensions?: List<MetricDimension>
    MetricName: Value<string>
    Namespace: Value<string>
    Statistic: Value<string>
    Unit?: Value<string>

    constructor(properties: CustomizedMetricSpecification) {
        Object.assign(this, properties)
    }
}

export class TargetTrackingScalingPolicyConfiguration {
    CustomizedMetricSpecification?: CustomizedMetricSpecification
    DisableScaleIn?: Value<boolean>
    PredefinedMetricSpecification?: PredefinedMetricSpecification
    ScaleInCooldown?: Value<number>
    ScaleOutCooldown?: Value<number>
    TargetValue: Value<number>

    constructor(properties: TargetTrackingScalingPolicyConfiguration) {
        Object.assign(this, properties)
    }
}

export interface ScalingPolicyProperties {
    PolicyName: Value<string>
    PolicyType: Value<string>
    ResourceId?: Value<string>
    ScalableDimension?: Value<string>
    ScalingTargetId?: Value<string>
    ServiceNamespace?: Value<string>
    StepScalingPolicyConfiguration?: StepScalingPolicyConfiguration
    TargetTrackingScalingPolicyConfiguration?: TargetTrackingScalingPolicyConfiguration
}

export default class ScalingPolicy extends ResourceBase {
    static StepScalingPolicyConfiguration = StepScalingPolicyConfiguration
    static MetricDimension = MetricDimension
    static StepAdjustment = StepAdjustment
    static PredefinedMetricSpecification = PredefinedMetricSpecification
    static CustomizedMetricSpecification = CustomizedMetricSpecification
    static TargetTrackingScalingPolicyConfiguration = TargetTrackingScalingPolicyConfiguration

    constructor(properties?: ScalingPolicyProperties) {
        super('AWS::ApplicationAutoScaling::ScalingPolicy', properties)
    }
}
