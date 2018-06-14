import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface KeyProperties {
    Description?: Value<string>;
    EnableKeyRotation?: Value<boolean>;
    Enabled?: Value<boolean>;
    KeyPolicy: any;
    KeyUsage?: Value<string>;
    Tags?: ResourceTag[];
}
export default class Key extends ResourceBase {
    constructor(properties?: KeyProperties);
}
