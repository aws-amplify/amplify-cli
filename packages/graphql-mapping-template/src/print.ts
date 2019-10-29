import {
  Expression,
  IfNode,
  IfElseNode,
  AndNode,
  OrNode,
  ParensNode,
  EqualsNode,
  NotEqualsNode,
  ForEachNode,
  StringNode,
  IntNode,
  NullNode,
  ReferenceNode,
  QuietReferenceNode,
  ObjectNode,
  ListNode,
  FloatNode,
  QuotesNode,
  RawNode,
  SetNode,
  CompoundExpressionNode,
  CommentNode,
  ToJsonNode,
  BooleanNode,
  compoundExpression,
  comment,
  NotNode,
  NewLineNode,
} from './ast';

const TAB = '  ';

function printIf(node: IfNode, indent: string = '') {
  if (node.inline) {
    return `#if( ${printExpr(node.predicate, '')} ) ${printExpr(node.expr, '')} #end`;
  }
  return `${indent}#if( ${printExpr(node.predicate, '')} )\n${printExpr(node.expr, indent + TAB)}\n${indent}#end`;
}

function printIfElse(node: IfElseNode, indent: string = '') {
  if (node.inline) {
    return `#if( ${printExpr(node.predicate)} ) ` + `${printExpr(node.ifExpr)} ` + `#else ` + `${printExpr(node.elseExpr)} ` + `#end`;
  }
  return (
    `${indent}#if( ${printExpr(node.predicate)} )\n` +
    `${printExpr(node.ifExpr, indent + TAB)}\n` +
    `${indent}#else\n` +
    `${printExpr(node.elseExpr, indent + TAB)}\n` +
    `${indent}#end`
  );
}

function printAnd(node: AndNode, indent: string = ''): string {
  return indent + node.expressions.map((e: Expression) => printExpr(e)).join(' && ');
}

function printOr(node: OrNode, indent: string = ''): string {
  return indent + node.expressions.map((e: Expression) => printExpr(e)).join(' || ');
}

function printParens(node: ParensNode, indent: string = ''): string {
  return `${indent}(${printExpr(node.expr)})`;
}

function printEquals(node: EqualsNode, indent: string = ''): string {
  return `${indent}${printExpr(node.leftExpr)} == ${printExpr(node.rightExpr)}`;
}

function printNotEquals(node: NotEqualsNode, indent: string = ''): string {
  return `${indent}${printExpr(node.leftExpr)} != ${printExpr(node.rightExpr)}`;
}

function printForEach(node: ForEachNode, indent: string = ''): string {
  return (
    `${indent}#foreach( ${printExpr(node.key)} in ${printExpr(node.collection)} )\n` +
    node.expressions.map((e: Expression) => printExpr(e, indent + TAB)).join('\n') +
    `\n${indent}#end`
  );
}

function printString(node: StringNode): string {
  return `"${node.value}"`;
}

function printBool(node: BooleanNode): string {
  return `${node.value}`;
}

function printRaw(node: RawNode, indent: string = ''): string {
  return `${indent}${node.value}`;
}

function printQuotes(node: QuotesNode): string {
  return `"${printExpr(node.expr)}"`;
}

function printInt(node: IntNode): string {
  return `${node.value}`;
}

function printFloat(node: FloatNode): string {
  return `${node.value}`;
}

function printNull(node: NullNode): string {
  return `null`;
}

function printReference(node: ReferenceNode): string {
  return `\$${node.value}`;
}

function printQuietReference(node: QuietReferenceNode, indent: string = ''): string {
  return `${indent}$util.qr(${node.value})`;
}

export function printObject(node: ObjectNode, indent: string = ''): string {
  const attributes = node.attributes.map((attr: [string, Expression], i: number) => {
    return `${indent}${TAB}"${attr[0]}": ${printExpr(attr[1], indent + TAB)}${i < node.attributes.length - 1 ? ',' : ''}`;
  });
  const divider = attributes.length > 0 ? `\n${indent}` : '';
  return `{${divider}${attributes.join(divider)}${divider}}`;
}

function printList(node: ListNode, indent: string = ''): string {
  const values = node.expressions.map((e: Expression) => printExpr(e, '')).join(', ');
  return `${indent}[${values}]`;
}

function printSet(node: SetNode, indent: string = ''): string {
  return `${indent}#set( ${printReference(node.key)} = ${printExpr(node.value, '')} )`;
}

function printComment(node: CommentNode, indent: string = ''): string {
  return `${indent}## ${node.text} **`;
}

function printCompoundExpression(node: CompoundExpressionNode, indent: string = ''): string {
  return node.expressions.map((node: Expression) => printExpr(node, indent)).join(`\n`);
}

function printToJson(node: ToJsonNode, indent: string = ''): string {
  return `${indent}$util.toJson(${printExpr(node.expr, '')})`;
}

function printNot(node: NotNode, indent: string = ''): string {
  return `${indent}!${printExpr(node.expr, '')}`;
}

function printNewLine(node: NewLineNode): string {
  return '\n';
}

function printExpr(expr: Expression, indent: string = ''): string {
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
      return printRaw(expr, indent);
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
    case 'Util.ToJson':
      return printToJson(expr, indent);
    case 'Not':
      return printNot(expr, indent);
    case 'NewLine':
      return printNewLine(expr);
    default:
      return '';
  }
}

export function print(expr: Expression): string {
  return printExpr(expr);
}

export function printBlock(name: string) {
  return (expr: Expression): string => {
    const wrappedExpr = compoundExpression([comment(`[Start] ${name}.`), expr, comment(`[End] ${name}.`)]);
    return printExpr(wrappedExpr);
  };
}
