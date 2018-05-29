"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function iff(predicate, expr, inline) {
    return {
        kind: 'If',
        predicate: predicate,
        expr: expr,
        inline: inline,
    };
}
exports.iff = iff;
function ifElse(predicate, ifExpr, elseExpr, inline) {
    return {
        kind: 'IfElse',
        predicate: predicate,
        ifExpr: ifExpr,
        elseExpr: elseExpr,
        inline: inline
    };
}
exports.ifElse = ifElse;
function and(expressions) {
    return {
        kind: 'And',
        expressions: expressions
    };
}
exports.and = and;
function or(expressions) {
    return {
        kind: 'Or',
        expressions: expressions
    };
}
exports.or = or;
function parens(expr) {
    return {
        kind: 'Parens',
        expr: expr
    };
}
exports.parens = parens;
function equals(leftExpr, rightExpr) {
    return {
        kind: 'Equals',
        leftExpr: leftExpr,
        rightExpr: rightExpr
    };
}
exports.equals = equals;
function notEquals(leftExpr, rightExpr) {
    return {
        kind: 'NotEquals',
        leftExpr: leftExpr,
        rightExpr: rightExpr
    };
}
exports.notEquals = notEquals;
function forEach(key, collection, expressions) {
    return {
        kind: 'ForEach',
        key: key,
        collection: collection,
        expressions: expressions
    };
}
exports.forEach = forEach;
function str(value) {
    return {
        kind: 'String',
        value: value
    };
}
exports.str = str;
function raw(value) {
    return {
        kind: 'Raw',
        value: value
    };
}
exports.raw = raw;
function quotes(expr) {
    return {
        kind: 'Quotes',
        expr: expr
    };
}
exports.quotes = quotes;
function float(value) {
    return {
        kind: 'Float',
        value: value
    };
}
exports.float = float;
function int(value) {
    return {
        kind: 'Int',
        value: value
    };
}
exports.int = int;
function nul() {
    return {
        kind: 'Null'
    };
}
exports.nul = nul;
function ref(value) {
    return {
        kind: 'Reference',
        value: value
    };
}
exports.ref = ref;
function qref(value) {
    return {
        kind: 'QuietReference',
        value: value
    };
}
exports.qref = qref;
// TODO: This can also take a plain object. What is easier in practice?
function obj(o) {
    var attributes = Object.keys(o).map(function (key) { return [key, o[key]]; });
    return {
        kind: 'Object',
        attributes: attributes
    };
}
exports.obj = obj;
function list(expressions) {
    return {
        kind: 'List',
        expressions: expressions
    };
}
exports.list = list;
function set(key, value) {
    return {
        kind: 'Set',
        key: key,
        value: value
    };
}
exports.set = set;
function comment(text) {
    return {
        kind: 'Comment',
        text: text
    };
}
exports.comment = comment;
function compoundExpression(expressions) {
    return {
        kind: 'CompoundExpression',
        expressions: expressions
    };
}
exports.compoundExpression = compoundExpression;
//# sourceMappingURL=ast.js.map