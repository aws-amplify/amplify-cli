import path from 'node:path';
import fs from 'node:fs/promises';
import { Generator } from '../_infra/generator';
import { AmplifyMigrationOperation } from '../../_operation';

/**
 * Writes amplify/package.json with ES module configuration.
 */
export class BackendPackageJsonGenerator implements Generator {
  public constructor(private readonly outputDir: string) {}

  /**
   * Plans the amplify/package.json generation operation.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const filePath = path.join(this.outputDir, 'amplify', 'package.json');
    return [
      {
        describe: async () => ['Generate amplify/package.json'],
        execute: async () => {
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          await fs.writeFile(filePath, JSON.stringify({ type: 'module' }, null, 2) + '\n', 'utf-8');
        },
      },
    ];
  }
}
