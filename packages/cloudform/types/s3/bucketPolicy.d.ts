import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface BucketPolicyProperties {
    Bucket: Value<string>;
    PolicyDocument: any;
}
export default class BucketPolicy extends ResourceBase {
    constructor(properties?: BucketPolicyProperties);
}
