import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface UserProfileProperties {
    AllowSelfManagement?: Value<boolean>;
    IamUserArn: Value<string>;
    SshPublicKey?: Value<string>;
    SshUsername?: Value<string>;
}
export default class UserProfile extends ResourceBase {
    constructor(properties?: UserProfileProperties);
}
