import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface EIPAssociationProperties {
    AllocationId?: Value<string>;
    EIP?: Value<string>;
    InstanceId?: Value<string>;
    NetworkInterfaceId?: Value<string>;
    PrivateIpAddress?: Value<string>;
}
export default class EIPAssociation extends ResourceBase {
    constructor(properties?: EIPAssociationProperties);
}
