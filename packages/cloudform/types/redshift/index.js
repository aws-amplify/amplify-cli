"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = require("./cluster");
const clusterParameterGroup_1 = require("./clusterParameterGroup");
const clusterSecurityGroupIngress_1 = require("./clusterSecurityGroupIngress");
const clusterSubnetGroup_1 = require("./clusterSubnetGroup");
const clusterSecurityGroup_1 = require("./clusterSecurityGroup");
exports.default = {
    Cluster: cluster_1.default,
    ClusterParameterGroup: clusterParameterGroup_1.default,
    ClusterSecurityGroupIngress: clusterSecurityGroupIngress_1.default,
    ClusterSubnetGroup: clusterSubnetGroup_1.default,
    ClusterSecurityGroup: clusterSecurityGroup_1.default
};
