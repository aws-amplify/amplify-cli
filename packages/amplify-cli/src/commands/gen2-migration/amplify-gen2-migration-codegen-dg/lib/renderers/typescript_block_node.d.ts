import ts from 'typescript';
import { Renderer } from '../render_pipeline.js';
export declare class TypescriptNodeArrayRenderer implements Renderer {
  private blockCreator;
  private writer;
  private printer;
  private sourceFile;
  constructor(blockCreator: () => Promise<ts.NodeArray<ts.Node>>, writer: (content: string) => Promise<void>);
  render: () => Promise<void>;
}
//# sourceMappingURL=typescript_block_node.d.ts.map
