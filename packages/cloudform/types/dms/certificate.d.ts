import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface CertificateProperties {
    CertificateIdentifier?: Value<string>;
    CertificatePem?: Value<string>;
    CertificateWallet?: Value<string>;
}
export default class Certificate extends ResourceBase {
    constructor(properties?: CertificateProperties);
}
