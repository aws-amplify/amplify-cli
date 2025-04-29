import ts from 'typescript';

export const printNode = (node: ts.Node) => {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const sourceFile = ts.createSourceFile('output.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const source = printer.printNode(ts.EmitHint.Unspecified, node, sourceFile);
  return source;
};
export const printNodeArray = (nodeArray: ts.NodeArray<ts.Node>) => {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
  const sourceFile = ts.createSourceFile('output.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  const source = printer.printList(ts.ListFormat.MultiLine, nodeArray, sourceFile);
  return source;
};
