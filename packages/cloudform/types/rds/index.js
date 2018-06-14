"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const dbSecurityGroupIngress_1 = require("./dbSecurityGroupIngress");
const dbCluster_1 = require("./dbCluster");
const dbSubnetGroup_1 = require("./dbSubnetGroup");
const optionGroup_1 = require("./optionGroup");
const dbParameterGroup_1 = require("./dbParameterGroup");
const eventSubscription_1 = require("./eventSubscription");
const dbInstance_1 = require("./dbInstance");
const dbSecurityGroup_1 = require("./dbSecurityGroup");
const dbClusterParameterGroup_1 = require("./dbClusterParameterGroup");
exports.default = {
    DBSecurityGroupIngress: dbSecurityGroupIngress_1.default,
    DBCluster: dbCluster_1.default,
    DBSubnetGroup: dbSubnetGroup_1.default,
    OptionGroup: optionGroup_1.default,
    DBParameterGroup: dbParameterGroup_1.default,
    EventSubscription: eventSubscription_1.default,
    DBInstance: dbInstance_1.default,
    DBSecurityGroup: dbSecurityGroup_1.default,
    DBClusterParameterGroup: dbClusterParameterGroup_1.default
};
