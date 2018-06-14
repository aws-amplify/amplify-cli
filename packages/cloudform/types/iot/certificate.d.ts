import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface CertificateProperties {
    CertificateSigningRequest: Value<string>;
    Status: Value<string>;
}
export default class Certificate extends ResourceBase {
    constructor(properties?: CertificateProperties);
}
