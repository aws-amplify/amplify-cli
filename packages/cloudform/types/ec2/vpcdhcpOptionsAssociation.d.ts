import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface VPCDHCPOptionsAssociationProperties {
    DhcpOptionsId: Value<string>;
    VpcId: Value<string>;
}
export default class VPCDHCPOptionsAssociation extends ResourceBase {
    constructor(properties?: VPCDHCPOptionsAssociationProperties);
}
