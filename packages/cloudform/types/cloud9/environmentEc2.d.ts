import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Repository {
    PathComponent: Value<string>;
    RepositoryUrl: Value<string>;
    constructor(properties: Repository);
}
export interface EnvironmentEC2Properties {
    Repositories?: List<Repository>;
    OwnerArn?: Value<string>;
    Description?: Value<string>;
    AutomaticStopTimeMinutes?: Value<number>;
    SubnetId?: Value<string>;
    InstanceType: Value<string>;
    Name?: Value<string>;
}
export default class EnvironmentEC2 extends ResourceBase {
    static Repository: typeof Repository;
    constructor(properties?: EnvironmentEC2Properties);
}
