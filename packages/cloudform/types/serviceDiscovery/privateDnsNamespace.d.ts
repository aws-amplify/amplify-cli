import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface PrivateDnsNamespaceProperties {
    Description?: Value<string>;
    Vpc: Value<string>;
    Name: Value<string>;
}
export default class PrivateDnsNamespace extends ResourceBase {
    constructor(properties?: PrivateDnsNamespaceProperties);
}
