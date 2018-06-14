import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface AccessKeyProperties {
    Serial?: Value<number>;
    Status?: Value<string>;
    UserName: Value<string>;
}
export default class AccessKey extends ResourceBase {
    constructor(properties?: AccessKeyProperties);
}
