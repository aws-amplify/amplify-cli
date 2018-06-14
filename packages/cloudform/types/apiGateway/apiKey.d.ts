import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class StageKey {
    RestApiId?: Value<string>;
    StageName?: Value<string>;
    constructor(properties: StageKey);
}
export interface ApiKeyProperties {
    CustomerId?: Value<string>;
    Description?: Value<string>;
    Enabled?: Value<boolean>;
    GenerateDistinctId?: Value<boolean>;
    Name?: Value<string>;
    StageKeys?: List<StageKey>;
}
export default class ApiKey extends ResourceBase {
    static StageKey: typeof StageKey;
    constructor(properties?: ApiKeyProperties);
}
