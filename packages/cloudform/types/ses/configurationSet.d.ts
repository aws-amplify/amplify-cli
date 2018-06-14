import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ConfigurationSetProperties {
    Name?: Value<string>;
}
export default class ConfigurationSet extends ResourceBase {
    constructor(properties?: ConfigurationSetProperties);
}
