import ts from 'typescript';
import * as prettier from 'prettier';

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
const sourceFile = ts.createSourceFile('output.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);

/**
 * Prints a TypeScript AST node array to a formatted string.
 * Applies prettier with single quotes and 2-space indentation
 * to match the project's code style.
 */
export function printNodes(nodes: ts.NodeArray<ts.Node>): string {
  const raw = printer.printList(ts.ListFormat.MultiLine, nodes, sourceFile);
  return prettier.format(raw, {
    parser: 'typescript',
    singleQuote: true,
    tabWidth: 2,
  });
}

/**
 * Prints a single TypeScript AST node to a string.
 */
export function printNode(node: ts.Node): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
}
