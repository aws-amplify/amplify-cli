import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../../planner';
import { AmplifyMigrationOperation } from '../../_operation';

/**
 * Writes amplify/tsconfig.json with Gen2 TypeScript configuration.
 */
export class TsConfigGenerator implements Planner {
  public constructor(private readonly outputDir: string) {}

  /**
   * Plans the tsconfig.json generation operation.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const filePath = path.join(this.outputDir, 'amplify', 'tsconfig.json');
    return [
      {
        validate: async () => {
          return;
        },
        describe: async () => ['Generate amplify/tsconfig.json'],
        execute: async () => {
          const tsconfig = {
            compilerOptions: {
              target: 'es2022',
              module: 'es2022',
              moduleResolution: 'bundler',
              resolveJsonModule: true,
              esModuleInterop: true,
              forceConsistentCasingInFileNames: true,
              strict: true,
              skipLibCheck: true,
              paths: {
                '$amplify/*': ['../.amplify/generated/*'],
              },
            },
          };
          await fs.mkdir(path.dirname(filePath), { recursive: true });
          const json = JSON.stringify(tsconfig, null, 2);
          // Collapse single-element arrays to one line for readability
          const collapsed = json.replace(/\[\s*\n\s*"([^"]+)"\s*\n\s*\]/g, '["$1"]');
          await fs.writeFile(filePath, collapsed + '\n', 'utf-8');
        },
      },
    ];
  }
}
