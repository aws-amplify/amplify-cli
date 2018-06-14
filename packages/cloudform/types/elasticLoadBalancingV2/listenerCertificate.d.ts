import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Certificate {
    CertificateArn?: Value<string>;
    constructor(properties: Certificate);
}
export interface ListenerCertificateProperties {
    Certificates: List<Certificate>;
    ListenerArn: Value<string>;
}
export default class ListenerCertificate extends ResourceBase {
    static Certificate: typeof Certificate;
    constructor(properties?: ListenerCertificateProperties);
}
