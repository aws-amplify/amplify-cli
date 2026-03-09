import ts from 'typescript';

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile('output.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

/**
 * Prints a TypeScript AST node array to a string.
 */
export function printNodes(nodes: ts.NodeArray<ts.Node>): string {
  return printer.printList(ts.ListFormat.MultiLine, nodes, sourceFile);
}

/**
 * Prints a single TypeScript AST node to a string.
 */
export function printNode(node: ts.Node): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}
