import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface CustomResourceProperties {
    ServiceToken: Value<string>;
}
export default class CustomResource extends ResourceBase {
    constructor(properties?: CustomResourceProperties);
}
