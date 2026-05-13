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
export type CfnTreeVisitor = (node: Readonly<Record<string, unknown>>) => Promise<unknown | undefined>;

/**
 * Recursively walks a JSON value, applying the visitor to each object node.
 */
export async function walkCfnTree(node: unknown, visitor: CfnTreeVisitor): Promise<unknown> {
  if (Array.isArray(node)) {
    return Promise.all(node.map((item) => walkCfnTree(item, visitor)));
  }
  if (node === null || typeof node !== 'object') {
    return node;
  }
  const record = node as Record<string, unknown>;
  const replacement = await visitor(record);
  if (replacement !== undefined) {
    return replacement;
  }
  const entries = await Promise.all(Object.entries(record).map(async ([key, value]) => [key, await walkCfnTree(value, visitor)] as const));
  return Object.fromEntries(entries);
}
