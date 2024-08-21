import { Renderer } from '../render_pipeline.js';

export class JsonRenderer implements Renderer {
  constructor(private createJson: () => Record<string, unknown>, private writeFile: (content: string) => Promise<void>) {}

  render = async (): Promise<void> => {
    const packageJson = this.createJson();
    await this.writeFile(JSON.stringify(packageJson, null, 2));
  };
}
