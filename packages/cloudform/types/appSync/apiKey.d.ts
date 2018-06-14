import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ApiKeyProperties {
    Description?: Value<string>;
    Expires?: Value<number>;
    ApiId: Value<string>;
}
export default class ApiKey extends ResourceBase {
    constructor(properties?: ApiKeyProperties);
}
