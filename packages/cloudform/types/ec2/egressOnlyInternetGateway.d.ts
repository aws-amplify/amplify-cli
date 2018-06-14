import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface EgressOnlyInternetGatewayProperties {
    VpcId: Value<string>;
}
export default class EgressOnlyInternetGateway extends ResourceBase {
    constructor(properties?: EgressOnlyInternetGatewayProperties);
}
