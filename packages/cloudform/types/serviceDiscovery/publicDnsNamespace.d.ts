import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface PublicDnsNamespaceProperties {
    Description?: Value<string>;
    Name: Value<string>;
}
export default class PublicDnsNamespace extends ResourceBase {
    constructor(properties?: PublicDnsNamespaceProperties);
}
