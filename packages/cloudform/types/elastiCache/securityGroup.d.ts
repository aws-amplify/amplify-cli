import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface SecurityGroupProperties {
    Description: Value<string>;
}
export default class SecurityGroup extends ResourceBase {
    constructor(properties?: SecurityGroupProperties);
}
