import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class DomainValidationOption {
    DomainName: Value<string>;
    ValidationDomain: Value<string>;
    constructor(properties: DomainValidationOption);
}
export interface CertificateProperties {
    DomainName: Value<string>;
    DomainValidationOptions?: List<DomainValidationOption>;
    SubjectAlternativeNames?: List<Value<string>>;
    Tags?: ResourceTag[];
    ValidationMethod?: Value<string>;
}
export default class Certificate extends ResourceBase {
    static DomainValidationOption: typeof DomainValidationOption;
    constructor(properties?: CertificateProperties);
}
