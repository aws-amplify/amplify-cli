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
function printString(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + "\"" + node.value + "\"";
}
function printRaw(node, indent) {
    if (indent === void 0) { indent = ''; }
    return "" + indent + node.value;
}
function printQuotes(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + "\"" + printExpr(node.expr) + "\"";
}
function printInt(node, indent) {
    if (indent === void 0) { indent = ''; }
    return "" + indent + node.value;
}
function printFloat(node, indent) {
    if (indent === void 0) { indent = ''; }
    return "" + indent + node.value;
}
function printNull(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + "null";
}
function printReference(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + "$" + node.value;
}
function printQuietReference(node, indent) {
    if (indent === void 0) { indent = ''; }
    return indent + "$util.qr(" + node.value + ")";
}
function printObject(node, indent) {
    if (indent === void 0) { indent = ''; }
    var attributes = node.attributes.map(function (attr, i) {
        return "" + indent + TAB + "\"" + attr[0] + "\": " + printExpr(attr[1], indent + TAB) + (i < node.attributes.length - 1 ? ',' : '');
    });
    var divider = attributes.length > 0 ? '\n' : '';
    return "{" + divider + attributes.join(divider) + divider + indent + "}";
}
exports.printObject = printObject;
function printList(node, indent) {
    if (indent === void 0) { indent = ''; }
    var values = node.expressions.map(function (e) { return printExpr(e); }).join(', ');
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
            return printString(expr, indent);
        case 'Raw':
            return printRaw(expr, indent);
        case 'Quotes':
            return printQuotes(expr, indent);
        case 'Float':
            return printFloat(expr, indent);
        case 'Int':
            return printInt(expr, indent);
        case 'Null':
            return printNull(expr, indent);
        case 'Reference':
            return printReference(expr, indent);
        case 'QuietReference':
            return printQuietReference(expr, indent);
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
        default:
            return '';
    }
}
function print(expr) {
    return printExpr(expr);
}
exports.print = print;
//# sourceMappingURL=print.js.map