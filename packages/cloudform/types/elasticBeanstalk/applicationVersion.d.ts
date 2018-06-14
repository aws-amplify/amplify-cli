import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class SourceBundle {
    S3Bucket: Value<string>;
    S3Key: Value<string>;
    constructor(properties: SourceBundle);
}
export interface ApplicationVersionProperties {
    ApplicationName: Value<string>;
    Description?: Value<string>;
    SourceBundle: SourceBundle;
}
export default class ApplicationVersion extends ResourceBase {
    static SourceBundle: typeof SourceBundle;
    constructor(properties?: ApplicationVersionProperties);
}
