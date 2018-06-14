import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ScheduledActionProperties {
    AutoScalingGroupName: Value<string>;
    DesiredCapacity?: Value<number>;
    EndTime?: Value<string>;
    MaxSize?: Value<number>;
    MinSize?: Value<number>;
    Recurrence?: Value<string>;
    StartTime?: Value<string>;
}
export default class ScheduledAction extends ResourceBase {
    constructor(properties?: ScheduledActionProperties);
}
