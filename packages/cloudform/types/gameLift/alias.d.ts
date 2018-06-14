import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class RoutingStrategy {
    FleetId?: Value<string>;
    Message?: Value<string>;
    Type: Value<string>;
    constructor(properties: RoutingStrategy);
}
export interface AliasProperties {
    Description?: Value<string>;
    Name: Value<string>;
    RoutingStrategy: RoutingStrategy;
}
export default class Alias extends ResourceBase {
    static RoutingStrategy: typeof RoutingStrategy;
    constructor(properties?: AliasProperties);
}
