"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const waitCondition_1 = require("./waitCondition");
const stack_1 = require("./stack");
const waitConditionHandle_1 = require("./waitConditionHandle");
const customResource_1 = require("./customResource");
exports.default = {
    WaitCondition: waitCondition_1.default,
    Stack: stack_1.default,
    WaitConditionHandle: waitConditionHandle_1.default,
    CustomResource: customResource_1.default
};
