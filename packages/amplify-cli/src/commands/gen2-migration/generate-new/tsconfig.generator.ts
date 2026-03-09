import path from 'node:path';
import fs from 'node:fs/promises';
import { Generator } from './generator';
import { AmplifyMigrationOperation } from '../_operation';

/**
 * Writes amplify/tsconfig.json with Gen2 TypeScript configuration.
 */
export class TsConfigGenerator implements Generator {
  public constructor(private readonly outputDir: string) {}

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const filePath = path.join(this.outputDir, 'amplify', 'tsconfig.json');
    return [
      {
        describe: async () => [`Generate ${filePath}`],
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
          await fs.writeFile(filePath, JSON.stringify(tsconfig, null, 2), 'utf-8');
        },
      },
    ];
  }
}
