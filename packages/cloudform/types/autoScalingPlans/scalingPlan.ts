/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ApplicationSource {
    CloudFormationStackARN?: Value<string>
    TagFilters?: List<TagFilter>

    constructor(properties: ApplicationSource) {
        Object.assign(this, properties)
    }
}

export class ScalingInstruction {
    ResourceId: Value<string>
    ServiceNamespace: Value<string>
    ScalableDimension: Value<string>
    MinCapacity: Value<number>
    TargetTrackingConfigurations: List<TargetTrackingConfiguration>
    MaxCapacity: Value<number>

    constructor(properties: ScalingInstruction) {
        Object.assign(this, properties)
    }
}

export class TargetTrackingConfiguration {
    ScaleOutCooldown?: Value<number>
    TargetValue: Value<number>
    PredefinedScalingMetricSpecification?: PredefinedScalingMetricSpecification
    DisableScaleIn?: Value<boolean>
    ScaleInCooldown?: Value<number>
    EstimatedInstanceWarmup?: Value<number>
    CustomizedScalingMetricSpecification?: CustomizedScalingMetricSpecification

    constructor(properties: TargetTrackingConfiguration) {
        Object.assign(this, properties)
    }
}

export class CustomizedScalingMetricSpecification {
    MetricName: Value<string>
    Statistic: Value<string>
    Dimensions?: List<MetricDimension>
    Unit?: Value<string>
    Namespace: Value<string>

    constructor(properties: CustomizedScalingMetricSpecification) {
        Object.assign(this, properties)
    }
}

export class MetricDimension {
    Value: Value<string>
    Name: Value<string>

    constructor(properties: MetricDimension) {
        Object.assign(this, properties)
    }
}

export class PredefinedScalingMetricSpecification {
    ResourceLabel?: Value<string>
    PredefinedScalingMetricType: Value<string>

    constructor(properties: PredefinedScalingMetricSpecification) {
        Object.assign(this, properties)
    }
}

export class TagFilter {
    Values?: List<Value<string>>
    Key: Value<string>

    constructor(properties: TagFilter) {
        Object.assign(this, properties)
    }
}

export interface ScalingPlanProperties {
    ApplicationSource: ApplicationSource
    ScalingInstructions: List<ScalingInstruction>
}

export default class ScalingPlan extends ResourceBase {
    static ApplicationSource = ApplicationSource
    static ScalingInstruction = ScalingInstruction
    static TargetTrackingConfiguration = TargetTrackingConfiguration
    static CustomizedScalingMetricSpecification = CustomizedScalingMetricSpecification
    static MetricDimension = MetricDimension
    static PredefinedScalingMetricSpecification = PredefinedScalingMetricSpecification
    static TagFilter = TagFilter

    constructor(properties?: ScalingPlanProperties) {
        super('AWS::AutoScalingPlans::ScalingPlan', properties)
    }
}
