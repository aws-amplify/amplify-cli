import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface SubnetRouteTableAssociationProperties {
    RouteTableId: Value<string>;
    SubnetId: Value<string>;
}
export default class SubnetRouteTableAssociation extends ResourceBase {
    constructor(properties?: SubnetRouteTableAssociationProperties);
}
