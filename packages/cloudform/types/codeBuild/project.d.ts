import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Artifacts {
    Path?: Value<string>;
    Type: Value<string>;
    Packaging?: Value<string>;
    Location?: Value<string>;
    Name?: Value<string>;
    NamespaceType?: Value<string>;
    constructor(properties: Artifacts);
}
export declare class SourceAuth {
    Type: Value<string>;
    Resource?: Value<string>;
    constructor(properties: SourceAuth);
}
export declare class Environment {
    Type: Value<string>;
    EnvironmentVariables?: List<EnvironmentVariable>;
    PrivilegedMode?: Value<boolean>;
    Image: Value<string>;
    ComputeType: Value<string>;
    constructor(properties: Environment);
}
export declare class ProjectCache {
    Type: Value<string>;
    Location?: Value<string>;
    constructor(properties: ProjectCache);
}
export declare class VpcConfig {
    Subnets: List<Value<string>>;
    VpcId: Value<string>;
    SecurityGroupIds: List<Value<string>>;
    constructor(properties: VpcConfig);
}
export declare class ProjectTriggers {
    Webhook?: Value<boolean>;
    constructor(properties: ProjectTriggers);
}
export declare class EnvironmentVariable {
    Type?: Value<string>;
    Value: Value<string>;
    Name: Value<string>;
    constructor(properties: EnvironmentVariable);
}
export declare class Source {
    Type: Value<string>;
    Auth?: SourceAuth;
    BuildSpec?: Value<string>;
    GitCloneDepth?: Value<number>;
    InsecureSsl?: Value<boolean>;
    Location?: Value<string>;
    constructor(properties: Source);
}
export interface ProjectProperties {
    Description?: Value<string>;
    VpcConfig?: VpcConfig;
    EncryptionKey?: Value<string>;
    Triggers?: ProjectTriggers;
    Source: Source;
    Name?: Value<string>;
    Artifacts: Artifacts;
    BadgeEnabled?: Value<boolean>;
    ServiceRole: Value<string>;
    Environment: Environment;
    Tags?: ResourceTag[];
    TimeoutInMinutes?: Value<number>;
    Cache?: ProjectCache;
}
export default class Project extends ResourceBase {
    static Artifacts: typeof Artifacts;
    static SourceAuth: typeof SourceAuth;
    static Environment: typeof Environment;
    static ProjectCache: typeof ProjectCache;
    static VpcConfig: typeof VpcConfig;
    static ProjectTriggers: typeof ProjectTriggers;
    static EnvironmentVariable: typeof EnvironmentVariable;
    static Source: typeof Source;
    constructor(properties?: ProjectProperties);
}
