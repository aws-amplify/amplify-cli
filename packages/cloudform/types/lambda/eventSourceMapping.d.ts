import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface EventSourceMappingProperties {
    BatchSize?: Value<number>;
    Enabled?: Value<boolean>;
    EventSourceArn: Value<string>;
    FunctionName: Value<string>;
    StartingPosition: Value<string>;
}
export default class EventSourceMapping extends ResourceBase {
    constructor(properties?: EventSourceMappingProperties);
}
