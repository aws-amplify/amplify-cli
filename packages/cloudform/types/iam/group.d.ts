import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Policy {
    PolicyDocument: any;
    PolicyName: Value<string>;
    constructor(properties: Policy);
}
export interface GroupProperties {
    GroupName?: Value<string>;
    ManagedPolicyArns?: List<Value<string>>;
    Path?: Value<string>;
    Policies?: List<Policy>;
}
export default class Group extends ResourceBase {
    static Policy: typeof Policy;
    constructor(properties?: GroupProperties);
}
