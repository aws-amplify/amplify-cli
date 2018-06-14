import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ModelProperties {
    ContentType?: Value<string>;
    Description?: Value<string>;
    Name?: Value<string>;
    RestApiId: Value<string>;
    Schema?: any;
}
export default class Model extends ResourceBase {
    constructor(properties?: ModelProperties);
}
