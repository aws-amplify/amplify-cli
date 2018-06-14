/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ScheduledAction {
    EndTime?: Value<string>
    ScalableTargetAction?: ScalableTargetAction
    Schedule: Value<string>
    ScheduledActionName: Value<string>
    StartTime?: Value<string>

    constructor(properties: ScheduledAction) {
        Object.assign(this, properties)
    }
}

export class ScalableTargetAction {
    MaxCapacity?: Value<number>
    MinCapacity?: Value<number>

    constructor(properties: ScalableTargetAction) {
        Object.assign(this, properties)
    }
}

export interface ScalableTargetProperties {
    MaxCapacity: Value<number>
    MinCapacity: Value<number>
    ResourceId: Value<string>
    RoleARN: Value<string>
    ScalableDimension: Value<string>
    ScheduledActions?: List<ScheduledAction>
    ServiceNamespace: Value<string>
}

export default class ScalableTarget extends ResourceBase {
    static ScheduledAction = ScheduledAction
    static ScalableTargetAction = ScalableTargetAction

    constructor(properties?: ScalableTargetProperties) {
        super('AWS::ApplicationAutoScaling::ScalableTarget', properties)
    }
}
