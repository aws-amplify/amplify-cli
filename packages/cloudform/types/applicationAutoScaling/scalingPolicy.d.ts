import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class StepScalingPolicyConfiguration {
    AdjustmentType?: Value<string>;
    Cooldown?: Value<number>;
    MetricAggregationType?: Value<string>;
    MinAdjustmentMagnitude?: Value<number>;
    StepAdjustments?: List<StepAdjustment>;
    constructor(properties: StepScalingPolicyConfiguration);
}
export declare class MetricDimension {
    Name: Value<string>;
    Value: Value<string>;
    constructor(properties: MetricDimension);
}
export declare class StepAdjustment {
    MetricIntervalLowerBound?: Value<number>;
    MetricIntervalUpperBound?: Value<number>;
    ScalingAdjustment: Value<number>;
    constructor(properties: StepAdjustment);
}
export declare class PredefinedMetricSpecification {
    PredefinedMetricType: Value<string>;
    ResourceLabel?: Value<string>;
    constructor(properties: PredefinedMetricSpecification);
}
export declare class CustomizedMetricSpecification {
    Dimensions?: List<MetricDimension>;
    MetricName: Value<string>;
    Namespace: Value<string>;
    Statistic: Value<string>;
    Unit?: Value<string>;
    constructor(properties: CustomizedMetricSpecification);
}
export declare class TargetTrackingScalingPolicyConfiguration {
    CustomizedMetricSpecification?: CustomizedMetricSpecification;
    DisableScaleIn?: Value<boolean>;
    PredefinedMetricSpecification?: PredefinedMetricSpecification;
    ScaleInCooldown?: Value<number>;
    ScaleOutCooldown?: Value<number>;
    TargetValue: Value<number>;
    constructor(properties: TargetTrackingScalingPolicyConfiguration);
}
export interface ScalingPolicyProperties {
    PolicyName: Value<string>;
    PolicyType: Value<string>;
    ResourceId?: Value<string>;
    ScalableDimension?: Value<string>;
    ScalingTargetId?: Value<string>;
    ServiceNamespace?: Value<string>;
    StepScalingPolicyConfiguration?: StepScalingPolicyConfiguration;
    TargetTrackingScalingPolicyConfiguration?: TargetTrackingScalingPolicyConfiguration;
}
export default class ScalingPolicy extends ResourceBase {
    static StepScalingPolicyConfiguration: typeof StepScalingPolicyConfiguration;
    static MetricDimension: typeof MetricDimension;
    static StepAdjustment: typeof StepAdjustment;
    static PredefinedMetricSpecification: typeof PredefinedMetricSpecification;
    static CustomizedMetricSpecification: typeof CustomizedMetricSpecification;
    static TargetTrackingScalingPolicyConfiguration: typeof TargetTrackingScalingPolicyConfiguration;
    constructor(properties?: ScalingPolicyProperties);
}
