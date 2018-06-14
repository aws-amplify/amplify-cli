import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Policy {
    PolicyDocument: any;
    PolicyName: Value<string>;
    constructor(properties: Policy);
}
export interface RoleProperties {
    AssumeRolePolicyDocument: any;
    ManagedPolicyArns?: List<Value<string>>;
    Path?: Value<string>;
    Policies?: List<Policy>;
    RoleName?: Value<string>;
}
export default class Role extends ResourceBase {
    static Policy: typeof Policy;
    constructor(properties?: RoleProperties);
}
