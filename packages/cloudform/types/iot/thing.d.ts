import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class AttributePayload {
    Attributes?: {
        [key: string]: Value<string>;
    };
    constructor(properties: AttributePayload);
}
export interface ThingProperties {
    AttributePayload?: AttributePayload;
    ThingName?: Value<string>;
}
export default class Thing extends ResourceBase {
    static AttributePayload: typeof AttributePayload;
    constructor(properties?: ThingProperties);
}
