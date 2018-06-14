import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface IPSetProperties {
    Format: Value<string>;
    Activate: Value<boolean>;
    DetectorId: Value<string>;
    Name?: Value<string>;
    Location: Value<string>;
}
export default class IPSet extends ResourceBase {
    constructor(properties?: IPSetProperties);
}
