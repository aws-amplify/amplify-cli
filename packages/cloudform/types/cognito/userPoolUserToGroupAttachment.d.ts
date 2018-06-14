import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface UserPoolUserToGroupAttachmentProperties {
    GroupName: Value<string>;
    UserPoolId: Value<string>;
    Username: Value<string>;
}
export default class UserPoolUserToGroupAttachment extends ResourceBase {
    constructor(properties?: UserPoolUserToGroupAttachmentProperties);
}
