/**
 * Shared recursive walker for CloudFormation template trees.
 *
 * The walker traverses an arbitrary JSON value (object, array, primitive).
 * At each object node, the visitor is called first. If the visitor returns
 * a non-undefined value, that value replaces the node and the walker does
 * NOT recurse into the replacement (the caller can re-walk if needed).
 * If the visitor returns undefined, the walker recurses into the object's values.
 */

/**
 * A visitor receives an object node and returns a replacement value,
 * or undefined to indicate "no replacement — keep recursing."
 */
export type CfnTreeVisitor = (node: Readonly<Record<string, unknown>>) => unknown | undefined;

/**
 * Recursively walks a JSON value, applying the visitor to each object node.
 */
export function walkCfnTree(node: unknown, visitor: CfnTreeVisitor): unknown {
  if (Array.isArray(node)) {
    return node.map((item) => walkCfnTree(item, visitor));
  }
  if (node === null || typeof node !== 'object') {
    return node;
  }
  const record = node as Record<string, unknown>;
  const replacement = visitor(record);
  if (replacement !== undefined) {
    return replacement;
  }
  return Object.fromEntries(Object.entries(record).map(([key, value]) => [key, walkCfnTree(value, visitor)]));
}
