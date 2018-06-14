import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface QueuePolicyProperties {
    PolicyDocument: any;
    Queues: List<Value<string>>;
}
export default class QueuePolicy extends ResourceBase {
    constructor(properties?: QueuePolicyProperties);
}
