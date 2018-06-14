import { ResourceBase, ResourceTag } from '../resource';
export interface InternetGatewayProperties {
    Tags?: ResourceTag[];
}
export default class InternetGateway extends ResourceBase {
    constructor(properties?: InternetGatewayProperties);
}
