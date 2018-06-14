import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ActivityProperties {
    Name: Value<string>;
}
export default class Activity extends ResourceBase {
    constructor(properties?: ActivityProperties);
}
