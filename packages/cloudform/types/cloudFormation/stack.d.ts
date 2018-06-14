import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export interface StackProperties {
    NotificationARNs?: List<Value<string>>;
    Parameters?: {
        [key: string]: Value<string>;
    };
    Tags?: ResourceTag[];
    TemplateURL: Value<string>;
    TimeoutInMinutes?: Value<number>;
}
export default class Stack extends ResourceBase {
    constructor(properties?: StackProperties);
}
