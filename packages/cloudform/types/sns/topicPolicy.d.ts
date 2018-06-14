import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface TopicPolicyProperties {
    PolicyDocument: any;
    Topics: List<Value<string>>;
}
export default class TopicPolicy extends ResourceBase {
    constructor(properties?: TopicPolicyProperties);
}
