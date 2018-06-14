import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface SecurityConfigurationProperties {
    Name?: Value<string>;
    SecurityConfiguration: any;
}
export default class SecurityConfiguration extends ResourceBase {
    constructor(properties?: SecurityConfigurationProperties);
}
