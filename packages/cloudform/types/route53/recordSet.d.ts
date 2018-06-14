import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class GeoLocation {
    ContinentCode?: Value<string>;
    CountryCode?: Value<string>;
    SubdivisionCode?: Value<string>;
    constructor(properties: GeoLocation);
}
export declare class AliasTarget {
    DNSName: Value<string>;
    EvaluateTargetHealth?: Value<boolean>;
    HostedZoneId: Value<string>;
    constructor(properties: AliasTarget);
}
export interface RecordSetProperties {
    AliasTarget?: AliasTarget;
    Comment?: Value<string>;
    Failover?: Value<string>;
    GeoLocation?: GeoLocation;
    HealthCheckId?: Value<string>;
    HostedZoneId?: Value<string>;
    HostedZoneName?: Value<string>;
    Name: Value<string>;
    Region?: Value<string>;
    ResourceRecords?: List<Value<string>>;
    SetIdentifier?: Value<string>;
    TTL?: Value<string>;
    Type: Value<string>;
    Weight?: Value<number>;
}
export default class RecordSet extends ResourceBase {
    static GeoLocation: typeof GeoLocation;
    static AliasTarget: typeof AliasTarget;
    constructor(properties?: RecordSetProperties);
}
