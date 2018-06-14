"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const ipSet_1 = require("./ipSet");
const sizeConstraintSet_1 = require("./sizeConstraintSet");
const rule_1 = require("./rule");
const byteMatchSet_1 = require("./byteMatchSet");
const sqlInjectionMatchSet_1 = require("./sqlInjectionMatchSet");
const webAcl_1 = require("./webAcl");
const xssMatchSet_1 = require("./xssMatchSet");
exports.default = {
    IPSet: ipSet_1.default,
    SizeConstraintSet: sizeConstraintSet_1.default,
    Rule: rule_1.default,
    ByteMatchSet: byteMatchSet_1.default,
    SqlInjectionMatchSet: sqlInjectionMatchSet_1.default,
    WebACL: webAcl_1.default,
    XssMatchSet: xssMatchSet_1.default
};
