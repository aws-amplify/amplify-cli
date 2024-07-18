import { Renderer, Result } from '../render_pipeline.js';

export class JsonRenderer implements Renderer {
  constructor(private createJson: () => Record<string, any>, private writeFile: (content: string) => Promise<void>) {}

  render = async (): Promise<Result<void>> => {
    const packageJson = this.createJson();
    await this.writeFile(JSON.stringify(packageJson, null, 2));
    return {};
  };
}
