import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ThreatIntelSetProperties {
    Format: Value<string>;
    Activate: Value<boolean>;
    DetectorId: Value<string>;
    Name?: Value<string>;
    Location: Value<string>;
}
export default class ThreatIntelSet extends ResourceBase {
    constructor(properties?: ThreatIntelSetProperties);
}
