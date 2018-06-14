import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface PolicyProperties {
    PolicyDocument: any;
    PolicyName?: Value<string>;
}
export default class Policy extends ResourceBase {
    constructor(properties?: PolicyProperties);
}
