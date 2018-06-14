import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface RouteTableProperties {
    Tags?: ResourceTag[];
    VpcId: Value<string>;
}
export default class RouteTable extends ResourceBase {
    constructor(properties?: RouteTableProperties);
}
