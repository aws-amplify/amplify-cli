"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class AliasRoutingConfiguration {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.AliasRoutingConfiguration = AliasRoutingConfiguration;
class VersionWeight {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.VersionWeight = VersionWeight;
class Alias extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::Lambda::Alias', properties);
    }
}
Alias.AliasRoutingConfiguration = AliasRoutingConfiguration;
Alias.VersionWeight = VersionWeight;
exports.default = Alias;
