import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class RunCommandParameters {
    RunCommandTargets: List<RunCommandTarget>;
    constructor(properties: RunCommandParameters);
}
export declare class Target {
    Arn: Value<string>;
    EcsParameters?: EcsParameters;
    Id: Value<string>;
    Input?: Value<string>;
    InputPath?: Value<string>;
    InputTransformer?: InputTransformer;
    KinesisParameters?: KinesisParameters;
    RoleArn?: Value<string>;
    RunCommandParameters?: RunCommandParameters;
    constructor(properties: Target);
}
export declare class RunCommandTarget {
    Key: Value<string>;
    Values: List<Value<string>>;
    constructor(properties: RunCommandTarget);
}
export declare class InputTransformer {
    InputPathsMap?: {
        [key: string]: Value<string>;
    };
    InputTemplate: Value<string>;
    constructor(properties: InputTransformer);
}
export declare class KinesisParameters {
    PartitionKeyPath: Value<string>;
    constructor(properties: KinesisParameters);
}
export declare class EcsParameters {
    TaskCount?: Value<number>;
    TaskDefinitionArn: Value<string>;
    constructor(properties: EcsParameters);
}
export interface RuleProperties {
    Description?: Value<string>;
    EventPattern?: any;
    Name?: Value<string>;
    RoleArn?: Value<string>;
    ScheduleExpression?: Value<string>;
    State?: Value<string>;
    Targets?: List<Target>;
}
export default class Rule extends ResourceBase {
    static RunCommandParameters: typeof RunCommandParameters;
    static Target: typeof Target;
    static RunCommandTarget: typeof RunCommandTarget;
    static InputTransformer: typeof InputTransformer;
    static KinesisParameters: typeof KinesisParameters;
    static EcsParameters: typeof EcsParameters;
    constructor(properties?: RuleProperties);
}
