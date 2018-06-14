"use strict";
/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
Object.defineProperty(exports, "__esModule", { value: true });
const sizeConstraintSet_1 = require("./sizeConstraintSet");
const sqlInjectionMatchSet_1 = require("./sqlInjectionMatchSet");
const xssMatchSet_1 = require("./xssMatchSet");
const byteMatchSet_1 = require("./byteMatchSet");
const webAclAssociation_1 = require("./webAclAssociation");
const webAcl_1 = require("./webAcl");
const rule_1 = require("./rule");
const ipSet_1 = require("./ipSet");
exports.default = {
    SizeConstraintSet: sizeConstraintSet_1.default,
    SqlInjectionMatchSet: sqlInjectionMatchSet_1.default,
    XssMatchSet: xssMatchSet_1.default,
    ByteMatchSet: byteMatchSet_1.default,
    WebACLAssociation: webAclAssociation_1.default,
    WebACL: webAcl_1.default,
    Rule: rule_1.default,
    IPSet: ipSet_1.default
};
