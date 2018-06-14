import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ReceiptRuleSetProperties {
    RuleSetName?: Value<string>;
}
export default class ReceiptRuleSet extends ResourceBase {
    constructor(properties?: ReceiptRuleSetProperties);
}
