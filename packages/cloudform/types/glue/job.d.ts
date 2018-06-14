import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class JobCommand {
    ScriptLocation?: Value<string>;
    Name?: Value<string>;
    constructor(properties: JobCommand);
}
export declare class ConnectionsList {
    Connections?: List<Value<string>>;
    constructor(properties: ConnectionsList);
}
export declare class ExecutionProperty {
    MaxConcurrentRuns?: Value<number>;
    constructor(properties: ExecutionProperty);
}
export interface JobProperties {
    Role: Value<string>;
    DefaultArguments?: any;
    Connections?: ConnectionsList;
    MaxRetries?: Value<number>;
    Description?: Value<string>;
    LogUri?: Value<string>;
    Command: JobCommand;
    AllocatedCapacity?: Value<number>;
    ExecutionProperty?: ExecutionProperty;
    Name?: Value<string>;
}
export default class Job extends ResourceBase {
    static JobCommand: typeof JobCommand;
    static ConnectionsList: typeof ConnectionsList;
    static ExecutionProperty: typeof ExecutionProperty;
    constructor(properties?: JobProperties);
}
