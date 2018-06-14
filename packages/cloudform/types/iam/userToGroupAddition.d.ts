import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface UserToGroupAdditionProperties {
    GroupName: Value<string>;
    Users: List<Value<string>>;
}
export default class UserToGroupAddition extends ResourceBase {
    constructor(properties?: UserToGroupAdditionProperties);
}
