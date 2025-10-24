import { Renderer } from '../render_pipeline';
export declare class JsonRenderer implements Renderer {
  private createJson;
  private writeFile;
  constructor(createJson: () => Promise<Record<string, unknown>>, writeFile: (content: string) => Promise<void>);
  render: () => Promise<void>;
}
//# sourceMappingURL=package_json.d.ts.map
