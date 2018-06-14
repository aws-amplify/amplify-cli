/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Filter {
    IpFilter: IpFilter
    Name?: Value<string>

    constructor(properties: Filter) {
        Object.assign(this, properties)
    }
}

export class IpFilter {
    Policy: Value<string>
    Cidr: Value<string>

    constructor(properties: IpFilter) {
        Object.assign(this, properties)
    }
}

export interface ReceiptFilterProperties {
    Filter: Filter
}

export default class ReceiptFilter extends ResourceBase {
    static Filter = Filter
    static IpFilter = IpFilter

    constructor(properties?: ReceiptFilterProperties) {
        super('AWS::SES::ReceiptFilter', properties)
    }
}
