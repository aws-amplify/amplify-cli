import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class ApplicationSource {
    CloudFormationStackARN?: Value<string>;
    TagFilters?: List<TagFilter>;
    constructor(properties: ApplicationSource);
}
export declare class ScalingInstruction {
    ResourceId: Value<string>;
    ServiceNamespace: Value<string>;
    ScalableDimension: Value<string>;
    MinCapacity: Value<number>;
    TargetTrackingConfigurations: List<TargetTrackingConfiguration>;
    MaxCapacity: Value<number>;
    constructor(properties: ScalingInstruction);
}
export declare class TargetTrackingConfiguration {
    ScaleOutCooldown?: Value<number>;
    TargetValue: Value<number>;
    PredefinedScalingMetricSpecification?: PredefinedScalingMetricSpecification;
    DisableScaleIn?: Value<boolean>;
    ScaleInCooldown?: Value<number>;
    EstimatedInstanceWarmup?: Value<number>;
    CustomizedScalingMetricSpecification?: CustomizedScalingMetricSpecification;
    constructor(properties: TargetTrackingConfiguration);
}
export declare class CustomizedScalingMetricSpecification {
    MetricName: Value<string>;
    Statistic: Value<string>;
    Dimensions?: List<MetricDimension>;
    Unit?: Value<string>;
    Namespace: Value<string>;
    constructor(properties: CustomizedScalingMetricSpecification);
}
export declare class MetricDimension {
    Value: Value<string>;
    Name: Value<string>;
    constructor(properties: MetricDimension);
}
export declare class PredefinedScalingMetricSpecification {
    ResourceLabel?: Value<string>;
    PredefinedScalingMetricType: Value<string>;
    constructor(properties: PredefinedScalingMetricSpecification);
}
export declare class TagFilter {
    Values?: List<Value<string>>;
    Key: Value<string>;
    constructor(properties: TagFilter);
}
export interface ScalingPlanProperties {
    ApplicationSource: ApplicationSource;
    ScalingInstructions: List<ScalingInstruction>;
}
export default class ScalingPlan extends ResourceBase {
    static ApplicationSource: typeof ApplicationSource;
    static ScalingInstruction: typeof ScalingInstruction;
    static TargetTrackingConfiguration: typeof TargetTrackingConfiguration;
    static CustomizedScalingMetricSpecification: typeof CustomizedScalingMetricSpecification;
    static MetricDimension: typeof MetricDimension;
    static PredefinedScalingMetricSpecification: typeof PredefinedScalingMetricSpecification;
    static TagFilter: typeof TagFilter;
    constructor(properties?: ScalingPlanProperties);
}
