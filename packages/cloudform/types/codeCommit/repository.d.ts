import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class RepositoryTrigger {
    Events?: List<Value<string>>;
    Branches?: List<Value<string>>;
    CustomData?: Value<string>;
    DestinationArn?: Value<string>;
    Name?: Value<string>;
    constructor(properties: RepositoryTrigger);
}
export interface RepositoryProperties {
    RepositoryName: Value<string>;
    Triggers?: List<RepositoryTrigger>;
    RepositoryDescription?: Value<string>;
}
export default class Repository extends ResourceBase {
    static RepositoryTrigger: typeof RepositoryTrigger;
    constructor(properties?: RepositoryProperties);
}
