/**
 * An if expression that takes a predicate and expression.
 */
export interface IfNode {
  kind: 'If';
  predicate: Expression;
  expr: Expression;
  inline: boolean;
}
export function iff(predicate: Expression, expr: Expression, inline?: boolean): IfNode {
  return {
    kind: 'If',
    predicate,
    expr,
    inline,
  };
}

/**
 * An if else expression that takes a predicate, if expr, and else expr.
 */
export interface IfElseNode {
  kind: 'IfElse';
  predicate: Expression;
  ifExpr: Expression;
  elseExpr: Expression;
  inline: boolean;
}
export function ifElse(predicate: Expression, ifExpr: Expression, elseExpr: Expression, inline?: boolean): IfElseNode {
  return {
    kind: 'IfElse',
    predicate,
    ifExpr,
    elseExpr,
    inline,
  };
}

/**
 * An and expression that takes two or more expressions and joins them with &&.
 */
export interface AndNode {
  kind: 'And';
  expressions: Expression[];
}
export function and(expressions: Expression[]): AndNode {
  return {
    kind: 'And',
    expressions,
  };
}

/**
 * An or expression that takes two or more expressions and join them with ||
 */
export interface OrNode {
  kind: 'Or';
  expressions: Expression[];
}
export function or(expressions: Expression[]): OrNode {
  return {
    kind: 'Or',
    expressions,
  };
}

/**Node
 * WrapsNodeNode an expression in (...) for order of operations.
 */
export interface ParensNode {
  kind: 'Parens';
  expr: Expression;
}
export function parens(expr: Expression): ParensNode {
  return {
    kind: 'Parens',
    expr,
  };
}

/**
 * Compares two expressions for equality.
 */
export interface EqualsNode {
  kind: 'Equals';
  leftExpr: Expression;
  rightExpr: Expression;
}
export function equals(leftExpr: Expression, rightExpr: Expression): EqualsNode {
  return {
    kind: 'Equals',
    leftExpr,
    rightExpr,
  };
}

/**
 * Compares two expressions for unequality.
 */
export interface NotEqualsNode {
  kind: 'NotEquals';
  leftExpr: Expression;
  rightExpr: Expression;
}
export function notEquals(leftExpr: Expression, rightExpr: Expression): NotEqualsNode {
  return {
    kind: 'NotEquals',
    leftExpr,
    rightExpr,
  };
}

/**
 * Compares two expressions for unequality.
 */
export interface NotNode {
  kind: 'Not';
  expr: Expression;
}
export function not(expr: Expression): NotNode {
  return {
    kind: 'Not',
    expr,
  };
}

/**
 * Iterates through a collection.
 */
export interface ForEachNode {
  kind: 'ForEach';
  key: ReferenceNode;
  collection: ReferenceNode;
  expressions: Expression[];
}
export function forEach(key: ReferenceNode, collection: ReferenceNode, expressions: Expression[]): ForEachNode {
  return {
    kind: 'ForEach',
    key,
    collection,
    expressions,
  };
}

/**
 * A literal string that should be printed in the template with quotes.
 */
export interface StringNode {
  kind: 'String';
  value: string;
}
export function str(value: string): StringNode {
  return {
    kind: 'String',
    value,
  };
}

/**
 * A literal string that should be printed in the template without quotes.
 */
export interface RawNode {
  kind: 'Raw';
  value: string;
}
export function raw(value: string): RawNode {
  return {
    kind: 'Raw',
    value,
  };
}

/**
 * Wraps an expression in quotes.
 */
export interface QuotesNode {
  kind: 'Quotes';
  expr: Expression;
}
export function quotes(expr: Expression): QuotesNode {
  return {
    kind: 'Quotes',
    expr,
  };
}

/**
 * A literal float that should be printed in the template.
 */
export interface FloatNode {
  kind: 'Float';
  value: number;
}
export function float(value: number): FloatNode {
  return {
    kind: 'Float',
    value,
  };
}

/**
 * A literal int that should be printed in the template.
 */
export interface IntNode {
  kind: 'Int';
  value: number;
}
export function int(value: number): IntNode {
  return {
    kind: 'Int',
    value,
  };
}

/**
 * A literal boolean that should be printed in the template.
 */
export interface BooleanNode {
  kind: 'Boolean';
  value: boolean;
}
export function bool(value: boolean): BooleanNode {
  return {
    kind: 'Boolean',
    value,
  };
}

/**
 * A literal null to be printed in the template.
 */
export interface NullNode {
  kind: 'Null';
}
export function nul(): NullNode {
  return {
    kind: 'Null',
  };
}

/**
 * A place holder is a string wrapped in ${}.
 * VTL replaces placeholders with values from the context.
 */
export interface ReferenceNode {
  kind: 'Reference';
  value: string;
}
export function ref(value: string): ReferenceNode {
  return {
    kind: 'Reference',
    value,
  };
}

/**
 * A place holder is a string wrapped in $!{}.
 * VTL replaces placeholders with values from the context.
 */
export interface QuietReferenceNode {
  kind: 'QuietReference';
  value: string;
}
export function qref(value: string): QuietReferenceNode {
  return {
    kind: 'QuietReference',
    value,
  };
}

/**
 * A JSON object serialized directly to the VTL.
 */
export interface ObjectNode {
  kind: 'Object';
  attributes: [string, Expression][];
}
// TODO: This can also take a plain object. What is easier in practice?
export function obj(o: { [key: string]: Expression }): ObjectNode {
  const attributes = Object.keys(o).map((key: string) => [key, o[key]] as [string, Expression]);
  return {
    kind: 'Object',
    attributes,
  };
}

/**
 * A JSON object serialized directly to the VTL.
 */
export interface ListNode {
  kind: 'List';
  expressions: Expression[];
}
export function list(expressions: Expression[]): ListNode {
  return {
    kind: 'List',
    expressions,
  };
}

/**
 * Set a value in the mapping template.
 */
export interface SetNode {
  kind: 'Set';
  key: ReferenceNode;
  value: Expression;
}
export function set(key: ReferenceNode, value: Expression): SetNode {
  return {
    kind: 'Set',
    key,
    value,
  };
}

export interface CommentNode {
  kind: 'Comment';
  text: string;
}
export function comment(text: string): CommentNode {
  return {
    kind: 'Comment',
    text,
  };
}

export interface CompoundExpressionNode {
  kind: 'CompoundExpression';
  expressions: Expression[];
}
export function compoundExpression(expressions: Expression[]): CompoundExpressionNode {
  return {
    kind: 'CompoundExpression',
    expressions,
  };
}

export type ToJsonNode = {
  kind: 'Util.ToJson';
  expr: Expression;
};
export function toJson(expr: Expression): ToJsonNode {
  return {
    kind: 'Util.ToJson',
    expr,
  };
}

export type NewLineNode = {
  kind: 'NewLine';
};
export function newline(): NewLineNode {
  return {
    kind: 'NewLine',
  };
}

export function block(name: string, exprs: Expression[]): CompoundExpressionNode {
  return compoundExpression([comment(`[Start] ${name}`), ...exprs, comment(`[End] ${name}`)]);
}

/**
 * A flow expression is one that dictates program flow e.g. if, ifelse, for, while, etc.
 */
export type Expression =
  | IfNode
  | IfElseNode
  | AndNode
  | OrNode
  | ParensNode
  | EqualsNode
  | NotEqualsNode
  | ForEachNode
  | StringNode
  | RawNode
  | QuotesNode
  | FloatNode
  | IntNode
  | BooleanNode
  | NullNode
  | ReferenceNode
  | QuietReferenceNode
  | ObjectNode
  | ListNode
  | SetNode
  | CommentNode
  | CompoundExpressionNode
  | ToJsonNode
  | NotNode
  | NewLineNode;
