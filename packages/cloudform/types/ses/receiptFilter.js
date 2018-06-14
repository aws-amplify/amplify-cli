"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Filter {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Filter = Filter;
class IpFilter {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.IpFilter = IpFilter;
class ReceiptFilter extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::SES::ReceiptFilter', properties);
    }
}
ReceiptFilter.Filter = Filter;
ReceiptFilter.IpFilter = IpFilter;
exports.default = ReceiptFilter;
