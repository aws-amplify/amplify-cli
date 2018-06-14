import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class Filter {
    IpFilter: IpFilter;
    Name?: Value<string>;
    constructor(properties: Filter);
}
export declare class IpFilter {
    Policy: Value<string>;
    Cidr: Value<string>;
    constructor(properties: IpFilter);
}
export interface ReceiptFilterProperties {
    Filter: Filter;
}
export default class ReceiptFilter extends ResourceBase {
    static Filter: typeof Filter;
    static IpFilter: typeof IpFilter;
    constructor(properties?: ReceiptFilterProperties);
}
