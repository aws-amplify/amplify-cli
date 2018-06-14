import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface GatewayResponseProperties {
    ResponseParameters?: {
        [key: string]: Value<string>;
    };
    ResponseTemplates?: {
        [key: string]: Value<string>;
    };
    ResponseType: Value<string>;
    RestApiId: Value<string>;
    StatusCode?: Value<string>;
}
export default class GatewayResponse extends ResourceBase {
    constructor(properties?: GatewayResponseProperties);
}
