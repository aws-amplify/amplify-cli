"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const resource_1 = require("../resource");
class VpnTunnelOptionsSpecification {
    constructor(properties) {
        Object.assign(this, properties);
    }
}
exports.VpnTunnelOptionsSpecification = VpnTunnelOptionsSpecification;
class VPNConnection extends resource_1.ResourceBase {
    constructor(properties) {
        super('AWS::EC2::VPNConnection', properties);
    }
}
VPNConnection.VpnTunnelOptionsSpecification = VpnTunnelOptionsSpecification;
exports.default = VPNConnection;
