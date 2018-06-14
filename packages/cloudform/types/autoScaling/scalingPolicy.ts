/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class MetricDimension {
    Name: Value<string>
    Value: Value<string>

    constructor(properties: MetricDimension) {
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

export class PredefinedMetricSpecification {
    PredefinedMetricType: Value<string>
    ResourceLabel?: Value<string>

    constructor(properties: PredefinedMetricSpecification) {
        Object.assign(this, properties)
    }
}

export class TargetTrackingConfiguration {
    CustomizedMetricSpecification?: CustomizedMetricSpecification
    DisableScaleIn?: Value<boolean>
    PredefinedMetricSpecification?: PredefinedMetricSpecification
    TargetValue: Value<number>

    constructor(properties: TargetTrackingConfiguration) {
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

export interface ScalingPolicyProperties {
    AdjustmentType?: Value<string>
    AutoScalingGroupName: Value<string>
    Cooldown?: Value<string>
    EstimatedInstanceWarmup?: Value<number>
    MetricAggregationType?: Value<string>
    MinAdjustmentMagnitude?: Value<number>
    PolicyType?: Value<string>
    ScalingAdjustment?: Value<number>
    StepAdjustments?: List<StepAdjustment>
    TargetTrackingConfiguration?: TargetTrackingConfiguration
}

export default class ScalingPolicy extends ResourceBase {
    static MetricDimension = MetricDimension
    static CustomizedMetricSpecification = CustomizedMetricSpecification
    static PredefinedMetricSpecification = PredefinedMetricSpecification
    static TargetTrackingConfiguration = TargetTrackingConfiguration
    static StepAdjustment = StepAdjustment

    constructor(properties?: ScalingPolicyProperties) {
        super('AWS::AutoScaling::ScalingPolicy', properties)
    }
}
