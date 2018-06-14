import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface VpcLinkProperties {
    Description?: Value<string>;
    TargetArns: List<Value<string>>;
    Name: Value<string>;
}
export default class VpcLink extends ResourceBase {
    constructor(properties?: VpcLinkProperties);
}
