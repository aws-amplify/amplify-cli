"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TAB = '  ';
function printIf(node, indent) {
    if (indent === void 0) { indent = ''; }
    if (node.inline) {
        return "#if( " + printExpr(node.predicate) + " ) " + printExpr(node.expr) + " #end";
    }
    return indent + "#if( " + printExpr(node.predicate) + " )\n" + indent + TAB + printExpr(node.expr) + "\n" + indent + "#end";
}
function printIfElse(node, indent) {
    if (indent === void 0) { indent = ''; }
    if (node.inline) {
        return "#if( " + printExpr(node.predicate) + " ) " +
            (printExpr(node.ifExpr) + " ") +
            "#else " +
            (printExpr(node.elseExpr) + " ") +
            "#end";
    }
    return indent + "#if( " + printExpr(node.predicate) + " )\n" +
        ("" + indent + TAB + printExpr(node.ifExpr) + "\n") +
        (indent + "#else\n") +
        ("" + indent + TAB + printExpr(node.elseExpr) + "\n") +
        (indent + "#end");
}
function printAnd(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + node.expressions.map(function (e) { return printExpr(e); }).join(' && ');
}
function printOr(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + node.expressions.map(function (e) { return printExpr(e); }).join(' || ');
}
function printParens(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + "(" + printExpr(node.expr) + ")";
}
function printEquals(node, indent) {
    if (indent === void 0) { indent = ''; }
    return "" + indent + printExpr(node.leftExpr) + " == " + printExpr(node.rightExpr);
}
function printNotEquals(node, indent) {
    if (indent === void 0) { indent = ''; }
    return "" + indent + printExpr(node.leftExpr) + " != " + printExpr(node.rightExpr);
}
function printForEach(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + "#foreach( " + printExpr(node.key) + " in " + printExpr(node.collection) + " )\n" +
        node.expressions.map(function (e) { return printExpr(e, indent + TAB); }).join('\n') +
        ("\n" + indent + "#end");
}
function printString(node) {
    return "\"" + node.value + "\"";
}
function printBool(node) {
    return "" + node.value;
}
function printRaw(node) {
    return "" + node.value;
}
function printQuotes(node) {
    return "\"" + printExpr(node.expr) + "\"";
}
function printInt(node) {
    return "" + node.value;
}
function printFloat(node) {
    return "" + node.value;
}
function printNull(node) {
    return "null";
}
function printReference(node) {
    return "$" + node.value;
}
function printQuietReference(node) {
    return "$util.qr(" + node.value + ")";
}
function printObject(node, indent) {
    if (indent === void 0) { indent = ''; }
    var attributes = node.attributes.map(function (attr, i) {
        return "" + indent + TAB + "\"" + attr[0] + "\": " + printExpr(attr[1], indent + TAB) + (i < node.attributes.length - 1 ? ',' : '');
    });
    var divider = attributes.length > 0 ? "\n" + indent : '';
    return "{" + divider + attributes.join(divider) + divider + "}";
}
exports.printObject = printObject;
function printList(node, indent) {
    if (indent === void 0) { indent = ''; }
    var values = node.expressions.map(function (e) { return printExpr(e, indent); }).join(', ');
    return indent + "[" + values + "]";
}
function printSet(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + "#set( " + printReference(node.key) + " = " + printExpr(node.value) + " )";
}
function printComment(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + "## " + node.text + " **";
}
function printCompoundExpression(node, indent) {
    if (indent === void 0) { indent = ''; }
    return node.expressions.map(function (node) { return printExpr(node, indent); }).join("\n" + indent);
}
function printToJson(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + "$util.toJson(" + printExpr(node.expr, '') + ")";
}
function printExpr(expr, indent) {
    if (indent === void 0) { indent = ''; }
    if (!expr) {
        return '';
    }
    switch (expr.kind) {
        case 'If':
            return printIf(expr, indent);
        case 'IfElse':
            return printIfElse(expr, indent);
        case 'And':
            return printAnd(expr, indent);
        case 'Or':
            return printOr(expr, indent);
        case 'Parens':
            return printParens(expr, indent);
        case 'Equals':
            return printEquals(expr, indent);
        case 'NotEquals':
            return printNotEquals(expr, indent);
        case 'ForEach':
            return printForEach(expr, indent);
        case 'String':
            return printString(expr);
        case 'Raw':
            return printRaw(expr);
        case 'Quotes':
            return printQuotes(expr);
        case 'Float':
            return printFloat(expr);
        case 'Int':
            return printInt(expr);
        case 'Boolean':
            return printBool(expr);
        case 'Null':
            return printNull(expr);
        case 'Reference':
            return printReference(expr);
        case 'QuietReference':
            return printQuietReference(expr);
        case 'Object':
            return printObject(expr, indent);
        case 'List':
            return printList(expr, indent);
        case 'Set':
            return printSet(expr, indent);
        case 'Comment':
            return printComment(expr, indent);
        case 'CompoundExpression':
            return printCompoundExpression(expr, indent);
        case 'Util.ToJson':
            return printToJson(expr, indent);
        default:
            return '';
    }
}
function print(expr) {
    return printExpr(expr);
}
exports.print = print;
//# sourceMappingURL=print.js.map