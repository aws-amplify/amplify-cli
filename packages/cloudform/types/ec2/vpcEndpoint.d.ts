import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface VPCEndpointProperties {
    PolicyDocument?: any;
    RouteTableIds?: List<Value<string>>;
    ServiceName: Value<string>;
    VpcId: Value<string>;
}
export default class VPCEndpoint extends ResourceBase {
    constructor(properties?: VPCEndpointProperties);
}
