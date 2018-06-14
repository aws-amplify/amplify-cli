/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Dimension {
    Name: Value<string>
    Value: Value<string>

    constructor(properties: Dimension) {
        Object.assign(this, properties)
    }
}

export interface AlarmProperties {
    ActionsEnabled?: Value<boolean>
    AlarmActions?: List<Value<string>>
    AlarmDescription?: Value<string>
    AlarmName?: Value<string>
    ComparisonOperator: Value<string>
    Dimensions?: List<Dimension>
    EvaluateLowSampleCountPercentile?: Value<string>
    EvaluationPeriods: Value<number>
    ExtendedStatistic?: Value<string>
    InsufficientDataActions?: List<Value<string>>
    MetricName: Value<string>
    Namespace: Value<string>
    OKActions?: List<Value<string>>
    Period: Value<number>
    Statistic?: Value<string>
    Threshold: Value<number>
    TreatMissingData?: Value<string>
    Unit?: Value<string>
}

export default class Alarm extends ResourceBase {
    static Dimension = Dimension

    constructor(properties?: AlarmProperties) {
        super('AWS::CloudWatch::Alarm', properties)
    }
}
