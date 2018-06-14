import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class MetricDimension {
    Name: Value<string>;
    Value: Value<string>;
    constructor(properties: MetricDimension);
}
export declare class CustomizedMetricSpecification {
    Dimensions?: List<MetricDimension>;
    MetricName: Value<string>;
    Namespace: Value<string>;
    Statistic: Value<string>;
    Unit?: Value<string>;
    constructor(properties: CustomizedMetricSpecification);
}
export declare class PredefinedMetricSpecification {
    PredefinedMetricType: Value<string>;
    ResourceLabel?: Value<string>;
    constructor(properties: PredefinedMetricSpecification);
}
export declare class TargetTrackingConfiguration {
    CustomizedMetricSpecification?: CustomizedMetricSpecification;
    DisableScaleIn?: Value<boolean>;
    PredefinedMetricSpecification?: PredefinedMetricSpecification;
    TargetValue: Value<number>;
    constructor(properties: TargetTrackingConfiguration);
}
export declare class StepAdjustment {
    MetricIntervalLowerBound?: Value<number>;
    MetricIntervalUpperBound?: Value<number>;
    ScalingAdjustment: Value<number>;
    constructor(properties: StepAdjustment);
}
export interface ScalingPolicyProperties {
    AdjustmentType?: Value<string>;
    AutoScalingGroupName: Value<string>;
    Cooldown?: Value<string>;
    EstimatedInstanceWarmup?: Value<number>;
    MetricAggregationType?: Value<string>;
    MinAdjustmentMagnitude?: Value<number>;
    PolicyType?: Value<string>;
    ScalingAdjustment?: Value<number>;
    StepAdjustments?: List<StepAdjustment>;
    TargetTrackingConfiguration?: TargetTrackingConfiguration;
}
export default class ScalingPolicy extends ResourceBase {
    static MetricDimension: typeof MetricDimension;
    static CustomizedMetricSpecification: typeof CustomizedMetricSpecification;
    static PredefinedMetricSpecification: typeof PredefinedMetricSpecification;
    static TargetTrackingConfiguration: typeof TargetTrackingConfiguration;
    static StepAdjustment: typeof StepAdjustment;
    constructor(properties?: ScalingPolicyProperties);
}
