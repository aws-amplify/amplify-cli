import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ClientCertificateProperties {
    Description?: Value<string>;
}
export default class ClientCertificate extends ResourceBase {
    constructor(properties?: ClientCertificateProperties);
}
