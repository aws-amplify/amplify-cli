import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface EventSubscriptionProperties {
    Enabled?: Value<boolean>;
    EventCategories?: List<Value<string>>;
    SnsTopicArn: Value<string>;
    SourceIds?: List<Value<string>>;
    SourceType?: Value<string>;
}
export default class EventSubscription extends ResourceBase {
    constructor(properties?: EventSubscriptionProperties);
}
