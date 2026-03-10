import path from 'node:path';
import fs from 'node:fs/promises';
import { Generator } from '../generator';
import { AmplifyMigrationOperation } from '../../_operation';
import { patchNpmPackageJson, PackageJson } from '../package-json-patch';

/**
 * Accumulates dependencies from category generators and writes the
 * root package.json with Gen2 TypeScript dependencies.
 *
 * Category generators call `addDependency()` and `addDevDependency()`
 * during their `plan()` phase.
 */
export class RootPackageJsonGenerator implements Generator {
  private readonly dependencies: Record<string, string> = {};
  private readonly devDependencies: Record<string, string> = {};
  private readonly outputDir: string;

  public constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  /**
   * Adds a runtime dependency.
   */
  public addDependency(name: string, version: string): void {
    this.dependencies[name] = version;
  }

  /**
   * Adds a dev dependency.
   */
  public addDevDependency(name: string, version: string): void {
    this.devDependencies[name] = version;
  }

  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const packageJsonPath = path.join(this.outputDir, 'package.json');

    return [
      {
        describe: async () => [`Generate ${packageJsonPath}`],
        execute: async () => {
          const defaultName = 'amplify-gen2';

          let packageJson: PackageJson = { name: defaultName };
          try {
            const existing = await fs.readFile('./package.json', { encoding: 'utf-8' });
            packageJson = JSON.parse(existing);
          } catch {
            // File doesn't exist or is inaccessible. Use default.
          }

          const merged: PackageJson = {
            ...packageJson,
            dependencies: {
              ...(packageJson.dependencies ?? {}),
              ...this.dependencies,
            },
            devDependencies: {
              ...(packageJson.devDependencies ?? {}),
              ...this.devDependencies,
            },
          };

          const patched = patchNpmPackageJson(merged, {
            'aws-cdk': '^2',
            'aws-cdk-lib': '^2',
            'ci-info': '^4.3.1',
            constructs: '^10.0.0',
            '@types/node': '*',
            '@aws-amplify/backend': '^1.18.0',
            '@aws-amplify/backend-cli': '^1.8.0',
            '@aws-amplify/backend-data': '^1.6.2',
            tsx: '^4.20.6',
            esbuild: '^0.27.0',
          });

          await fs.mkdir(path.dirname(packageJsonPath), { recursive: true });
          await fs.writeFile(packageJsonPath, JSON.stringify(patched, null, 2) + '\n', 'utf-8');
        },
      },
    ];
  }
}
