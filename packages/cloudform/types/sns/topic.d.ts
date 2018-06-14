import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Subscription {
    Endpoint: Value<string>;
    Protocol: Value<string>;
    constructor(properties: Subscription);
}
export interface TopicProperties {
    DisplayName?: Value<string>;
    Subscription?: List<Subscription>;
    TopicName?: Value<string>;
}
export default class Topic extends ResourceBase {
    static Subscription: typeof Subscription;
    constructor(properties?: TopicProperties);
}
