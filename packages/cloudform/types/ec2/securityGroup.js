"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class Ingress {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Ingress = Ingress;
class Egress {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.Egress = Egress;
class SecurityGroup extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EC2::SecurityGroup', properties);
    }
}
SecurityGroup.Ingress = Ingress;
SecurityGroup.Egress = Egress;
exports.default = SecurityGroup;
