import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface PolicyPrincipalAttachmentProperties {
    PolicyName: Value<string>;
    Principal: Value<string>;
}
export default class PolicyPrincipalAttachment extends ResourceBase {
    constructor(properties?: PolicyPrincipalAttachmentProperties);
}
