import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface DomainProperties {
    Description?: Value<string>;
}
export default class Domain extends ResourceBase {
    constructor(properties?: DomainProperties);
}
