import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class TargetGroupAttribute {
    Key?: Value<string>;
    Value?: Value<string>;
    constructor(properties: TargetGroupAttribute);
}
export declare class Matcher {
    HttpCode: Value<string>;
    constructor(properties: Matcher);
}
export declare class TargetDescription {
    AvailabilityZone?: Value<string>;
    Id: Value<string>;
    Port?: Value<number>;
    constructor(properties: TargetDescription);
}
export interface TargetGroupProperties {
    HealthCheckIntervalSeconds?: Value<number>;
    HealthCheckPath?: Value<string>;
    HealthCheckPort?: Value<string>;
    HealthCheckProtocol?: Value<string>;
    HealthCheckTimeoutSeconds?: Value<number>;
    HealthyThresholdCount?: Value<number>;
    Matcher?: Matcher;
    Name?: Value<string>;
    Port: Value<number>;
    Protocol: Value<string>;
    Tags?: ResourceTag[];
    TargetGroupAttributes?: List<TargetGroupAttribute>;
    TargetType?: Value<string>;
    Targets?: List<TargetDescription>;
    UnhealthyThresholdCount?: Value<number>;
    VpcId: Value<string>;
}
export default class TargetGroup extends ResourceBase {
    static TargetGroupAttribute: typeof TargetGroupAttribute;
    static Matcher: typeof Matcher;
    static TargetDescription: typeof TargetDescription;
    constructor(properties?: TargetGroupProperties);
}
