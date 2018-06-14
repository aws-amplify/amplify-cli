"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const volume_1 = require("./volume");
const app_1 = require("./app");
const layer_1 = require("./layer");
const stack_1 = require("./stack");
const elasticLoadBalancerAttachment_1 = require("./elasticLoadBalancerAttachment");
const instance_1 = require("./instance");
const userProfile_1 = require("./userProfile");
exports.default = {
    Volume: volume_1.default,
    App: app_1.default,
    Layer: layer_1.default,
    Stack: stack_1.default,
    ElasticLoadBalancerAttachment: elasticLoadBalancerAttachment_1.default,
    Instance: instance_1.default,
    UserProfile: userProfile_1.default
};
