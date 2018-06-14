/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ScheduledActionProperties {
    AutoScalingGroupName: Value<string>
    DesiredCapacity?: Value<number>
    EndTime?: Value<string>
    MaxSize?: Value<number>
    MinSize?: Value<number>
    Recurrence?: Value<string>
    StartTime?: Value<string>
}

export default class ScheduledAction extends ResourceBase {


    constructor(properties?: ScheduledActionProperties) {
        super('AWS::AutoScaling::ScheduledAction', properties)
    }
}
