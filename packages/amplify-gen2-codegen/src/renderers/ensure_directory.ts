import fs from 'node:fs/promises';
import { Renderer, Result } from '../render_pipeline.js';

export class EnsureDirectory implements Renderer {
  constructor(private directory: string) {}
  render = async (): Promise<Result<void>> => {
    await fs.mkdir(this.directory, { recursive: true });
    return {};
  };
}
