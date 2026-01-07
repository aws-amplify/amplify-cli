import { Renderer } from '../render_pipeline';

export class JsonRenderer implements Renderer {
  constructor(private createJson: () => Promise<Record<string, unknown>>, private writeFile: (content: string) => Promise<void>) {}

  render = async (): Promise<void> => {
    const packageJson = await this.createJson();
    await this.writeFile(JSON.stringify(packageJson, null, 2));
  };
}
