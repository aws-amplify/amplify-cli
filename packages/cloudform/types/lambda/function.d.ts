import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class VpcConfig {
    SecurityGroupIds: List<Value<string>>;
    SubnetIds: List<Value<string>>;
    constructor(properties: VpcConfig);
}
export declare class DeadLetterConfig {
    TargetArn?: Value<string>;
    constructor(properties: DeadLetterConfig);
}
export declare class TracingConfig {
    Mode?: Value<string>;
    constructor(properties: TracingConfig);
}
export declare class Code {
    S3Bucket?: Value<string>;
    S3Key?: Value<string>;
    S3ObjectVersion?: Value<string>;
    ZipFile?: Value<string>;
    constructor(properties: Code);
}
export declare class Environment {
    Variables?: {
        [key: string]: Value<string>;
    };
    constructor(properties: Environment);
}
export interface FunctionProperties {
    Code: Code;
    DeadLetterConfig?: DeadLetterConfig;
    Description?: Value<string>;
    Environment?: Environment;
    FunctionName?: Value<string>;
    Handler: Value<string>;
    KmsKeyArn?: Value<string>;
    MemorySize?: Value<number>;
    ReservedConcurrentExecutions?: Value<number>;
    Role: Value<string>;
    Runtime: Value<string>;
    Tags?: ResourceTag[];
    Timeout?: Value<number>;
    TracingConfig?: TracingConfig;
    VpcConfig?: VpcConfig;
}
export default class Function extends ResourceBase {
    static VpcConfig: typeof VpcConfig;
    static DeadLetterConfig: typeof DeadLetterConfig;
    static TracingConfig: typeof TracingConfig;
    static Code: typeof Code;
    static Environment: typeof Environment;
    constructor(properties?: FunctionProperties);
}
