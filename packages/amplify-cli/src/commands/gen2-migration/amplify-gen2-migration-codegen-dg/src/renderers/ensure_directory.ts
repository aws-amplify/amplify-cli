import fs from 'node:fs/promises';
import { Renderer } from '../render_pipeline';

export class EnsureDirectory implements Renderer {
  constructor(private directory: string) {}
  render = async (): Promise<void> => {
    await fs.mkdir(this.directory, { recursive: true });
  };
}
