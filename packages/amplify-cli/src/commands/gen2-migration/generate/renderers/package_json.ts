import { Renderer } from '../render_pipeline';
import * as prettier from 'prettier';

export class JsonRenderer implements Renderer {
  constructor(private createJson: () => Promise<Record<string, unknown>>, private writeFile: (content: string) => Promise<void>) {}

  render = async (): Promise<void> => {
    const packageJson = await this.createJson();
    const content = JSON.stringify(packageJson, null, 2);
    const formatted = prettier.format(content, {
      parser: 'json',
      tabWidth: 2,
    });

    await this.writeFile(formatted);
  };
}
