"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const securityGroup_1 = require("./securityGroup");
const subnetGroup_1 = require("./subnetGroup");
const securityGroupIngress_1 = require("./securityGroupIngress");
const replicationGroup_1 = require("./replicationGroup");
const parameterGroup_1 = require("./parameterGroup");
const cacheCluster_1 = require("./cacheCluster");
exports.default = {
    SecurityGroup: securityGroup_1.default,
    SubnetGroup: subnetGroup_1.default,
    SecurityGroupIngress: securityGroupIngress_1.default,
    ReplicationGroup: replicationGroup_1.default,
    ParameterGroup: parameterGroup_1.default,
    CacheCluster: cacheCluster_1.default
};
