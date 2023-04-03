"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseValue = void 0;
const lodash_1 = require("lodash");
const intrinsic_functions_1 = require("./intrinsic-functions");
const intrinsicFunctionMap = {
    'Fn::Join': intrinsic_functions_1.cfnJoin,
    'Fn::Sub': intrinsic_functions_1.cfnSub,
    'Fn::GetAtt': intrinsic_functions_1.cfnGetAtt,
    'Fn::Split': intrinsic_functions_1.cfnSplit,
    Ref: intrinsic_functions_1.cfnRef,
    'Fn::Select': intrinsic_functions_1.cfnSelect,
    'Fn::If': intrinsic_functions_1.cfnIf,
    'Fn::Equals': intrinsic_functions_1.cfnEquals,
    'Fn::And': intrinsic_functions_1.cfnAnd,
    'Fn::Or': intrinsic_functions_1.cfnOr,
    'Fn::Not': intrinsic_functions_1.cfnNot,
    Condition: intrinsic_functions_1.cfnCondition,
    'Fn::ImportValue': intrinsic_functions_1.cfnImportValue,
};
function parseValue(node, context) {
    if (['string', 'number'].includes(typeof node))
        return node;
    node = JSON.parse(JSON.stringify(node));
    if ((0, lodash_1.isPlainObject)(node) && Object.keys(node).length === 1 && Object.keys(intrinsicFunctionMap).includes(Object.keys(node)[0])) {
        const op = Object.keys(node)[0];
        const valNode = node[op];
        return intrinsicFunctionMap[op](valNode, context, parseValue);
    }
    throw new Error(`Could not process value node ${JSON.stringify(node)}`);
}
exports.parseValue = parseValue;
//# sourceMappingURL=field-parser.js.map