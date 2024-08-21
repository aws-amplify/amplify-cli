import ts from 'typescript';
import { Renderer } from '../render_pipeline.js';
export class TypescriptNodeArrayRenderer implements Renderer {
  private printer: ts.Printer;
  private sourceFile: ts.SourceFile;
  constructor(private blockCreator: () => Promise<ts.NodeArray<ts.Node>>, private writer: (content: string) => Promise<void>) {
    this.printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    this.sourceFile = ts.createSourceFile('output.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS);
  }
  render = async (): Promise<void> => {
    const block = await this.blockCreator();
    const source = this.printer.printList(ts.ListFormat.MultiLine, block, this.sourceFile);
    await this.writer(source);
  };
}
