import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class S3Location {
    Bucket: Value<string>;
    Key: Value<string>;
    RoleArn: Value<string>;
    constructor(properties: S3Location);
}
export interface BuildProperties {
    Name?: Value<string>;
    StorageLocation?: S3Location;
    Version?: Value<string>;
}
export default class Build extends ResourceBase {
    static S3Location: typeof S3Location;
    constructor(properties?: BuildProperties);
}
