import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ApplicationProperties {
    ApplicationName?: Value<string>;
    ComputePlatform?: Value<string>;
}
export default class Application extends ResourceBase {
    constructor(properties?: ApplicationProperties);
}
