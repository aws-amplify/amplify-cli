/**
 * An if expression that takes a predicate and expression.
 */
export interface IfNode {
    kind: 'If';
    predicate: Expression;
    expr: Expression;
    inline: boolean;
}
export declare function iff(predicate: Expression, expr: Expression, inline?: boolean): IfNode;
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
export declare function ifElse(predicate: Expression, ifExpr: Expression, elseExpr: Expression, inline?: boolean): IfElseNode;
/**
 * An and expression that takes two or more expressions and joins them with &&.
 */
export interface AndNode {
    kind: 'And';
    expressions: Expression[];
}
export declare function and(expressions: Expression[]): AndNode;
/**
 * An or expression that takes two or more expressions and join them with ||
 */
export interface OrNode {
    kind: 'Or';
    expressions: Expression[];
}
export declare function or(expressions: Expression[]): OrNode;
/**Node
 * WrapsNodeNode an expression in (...) for order of operations.
 */
export interface ParensNode {
    kind: 'Parens';
    expr: Expression;
}
export declare function parens(expr: Expression): ParensNode;
/**
 * Compares two expressions for equality.
 */
export interface EqualsNode {
    kind: 'Equals';
    leftExpr: Expression;
    rightExpr: Expression;
}
export declare function equals(leftExpr: Expression, rightExpr: Expression): EqualsNode;
/**
 * Compares two expressions for unequality.
 */
export interface NotEqualsNode {
    kind: 'NotEquals';
    leftExpr: Expression;
    rightExpr: Expression;
}
export declare function notEquals(leftExpr: Expression, rightExpr: Expression): NotEqualsNode;
/**
 * Iterates through a collection.
 */
export interface ForEachNode {
    kind: 'ForEach';
    key: ReferenceNode;
    collection: ReferenceNode;
    expressions: Expression[];
}
export declare function forEach(key: ReferenceNode, collection: ReferenceNode, expressions: Expression[]): ForEachNode;
/**
 * A literal string that should be printed in the template with quotes.
 */
export interface StringNode {
    kind: 'String';
    value: string;
}
export declare function str(value: string): StringNode;
/**
 * A literal string that should be printed in the template without quotes.
 */
export interface RawNode {
    kind: 'Raw';
    value: string;
}
export declare function raw(value: string): RawNode;
/**
 * Wraps an expression in quotes.
 */
export interface QuotesNode {
    kind: 'Quotes';
    expr: Expression;
}
export declare function quotes(expr: Expression): QuotesNode;
/**
 * A literal float that should be printed in the template.
 */
export interface FloatNode {
    kind: 'Float';
    value: number;
}
export declare function float(value: number): FloatNode;
/**
 * A literal int that should be printed in the template.
 */
export interface IntNode {
    kind: 'Int';
    value: number;
}
export declare function int(value: number): IntNode;
/**
 * A literal boolean that should be printed in the template.
 */
export interface BooleanNode {
    kind: 'Boolean';
    value: boolean;
}
export declare function bool(value: boolean): BooleanNode;
/**
 * A literal null to be printed in the template.
 */
export interface NullNode {
    kind: 'Null';
}
export declare function nul(): NullNode;
/**
 * A place holder is a string wrapped in ${}.
 * VTL replaces placeholders with values from the context.
 */
export interface ReferenceNode {
    kind: 'Reference';
    value: string;
}
export declare function ref(value: string): ReferenceNode;
/**
 * A place holder is a string wrapped in $!{}.
 * VTL replaces placeholders with values from the context.
 */
export interface QuietReferenceNode {
    kind: 'QuietReference';
    value: string;
}
export declare function qref(value: string): QuietReferenceNode;
/**
 * A JSON object serialized directly to the VTL.
 */
export interface ObjectNode {
    kind: 'Object';
    attributes: [string, Expression][];
}
export declare function obj(o: {
    [key: string]: Expression;
}): ObjectNode;
/**
 * A JSON object serialized directly to the VTL.
 */
export interface ListNode {
    kind: 'List';
    expressions: Expression[];
}
export declare function list(expressions: Expression[]): ListNode;
/**
 * Set a value in the mapping template.
 */
export interface SetNode {
    kind: 'Set';
    key: ReferenceNode;
    value: Expression;
}
export declare function set(key: ReferenceNode, value: Expression): SetNode;
export interface CommentNode {
    kind: 'Comment';
    text: string;
}
export declare function comment(text: string): CommentNode;
export interface CompoundExpressionNode {
    kind: 'CompoundExpression';
    expressions: Expression[];
}
export declare function compoundExpression(expressions: Expression[]): CompoundExpressionNode;
export declare type ToJsonNode = {
    kind: 'Util.ToJson';
    expr: Expression;
};
export declare function toJson(expr: Expression): ToJsonNode;
/**
 * A flow expression is one that dictates program flow e.g. if, ifelse, for, while, etc.
 */
export declare type Expression = IfNode | IfElseNode | AndNode | OrNode | ParensNode | EqualsNode | NotEqualsNode | ForEachNode | StringNode | RawNode | QuotesNode | FloatNode | IntNode | BooleanNode | NullNode | ReferenceNode | QuietReferenceNode | ObjectNode | ListNode | SetNode | CommentNode | CompoundExpressionNode | ToJsonNode;
