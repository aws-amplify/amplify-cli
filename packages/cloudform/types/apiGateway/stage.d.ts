import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class MethodSetting {
    CacheDataEncrypted?: Value<boolean>;
    CacheTtlInSeconds?: Value<number>;
    CachingEnabled?: Value<boolean>;
    DataTraceEnabled?: Value<boolean>;
    HttpMethod?: Value<string>;
    LoggingLevel?: Value<string>;
    MetricsEnabled?: Value<boolean>;
    ResourcePath?: Value<string>;
    ThrottlingBurstLimit?: Value<number>;
    ThrottlingRateLimit?: Value<number>;
    constructor(properties: MethodSetting);
}
export interface StageProperties {
    CacheClusterEnabled?: Value<boolean>;
    CacheClusterSize?: Value<string>;
    ClientCertificateId?: Value<string>;
    DeploymentId?: Value<string>;
    Description?: Value<string>;
    DocumentationVersion?: Value<string>;
    MethodSettings?: List<MethodSetting>;
    RestApiId: Value<string>;
    StageName?: Value<string>;
    Variables?: {
        [key: string]: Value<string>;
    };
}
export default class Stage extends ResourceBase {
    static MethodSetting: typeof MethodSetting;
    constructor(properties?: StageProperties);
}
