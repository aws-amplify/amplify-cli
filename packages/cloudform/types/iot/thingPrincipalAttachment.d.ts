import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ThingPrincipalAttachmentProperties {
    Principal: Value<string>;
    ThingName: Value<string>;
}
export default class ThingPrincipalAttachment extends ResourceBase {
    constructor(properties?: ThingPrincipalAttachmentProperties);
}
