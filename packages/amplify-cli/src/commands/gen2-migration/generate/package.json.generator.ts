import path from 'node:path';
import fs from 'node:fs/promises';
import { Planner } from '../_infra/planner';
import { AmplifyMigrationOperation } from '../_infra/operation';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

type PackageJson = {
  readonly name: string;
  readonly scripts?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly dependencies?: Record<string, string>;
};

const GEN2_DEV_DEPENDENCIES: Record<string, string> = {
  '@aws-amplify/backend': '^1.18.0',
  '@aws-amplify/backend-cli': '^1.8.0',
  '@aws-amplify/backend-data': '^1.6.2',
  '@types/node': '*',
  'aws-cdk': '^2',
  'aws-cdk-lib': '^2',
  'ci-info': '^4.3.1',
  constructs: '^10.0.0',
  esbuild: '^0.27.0',
  tsx: '^4.20.6',
};

function sortKeys(obj: Record<string, string>): Record<string, string> {
  return Object.keys(obj)
    .sort()
    .reduce<Record<string, string>>((sorted, key) => {
      sorted[key] = obj[key];
      return sorted;
    }, {});
}

/**
 * Accumulates dependencies from category generators and writes the
 * root package.json with Gen2 TypeScript dependencies.
 *
 * Category generators call `addDependency()` and `addDevDependency()`
 * during their `plan()` phase.
 */
export class RootPackageJsonGenerator implements Planner {
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

  /**
   * Plans the root package.json generation operation.
   */
  public async plan(): Promise<AmplifyMigrationOperation[]> {
    const packageJsonPath = path.join(this.outputDir, 'package.json');

    return [
      {
        validate: () => undefined,
        describe: async () => ['Update package.json with Gen2 dependencies'],
        execute: async () => {
          const defaultName = 'amplify-gen2';

          let packageJson: PackageJson = { name: defaultName };
          try {
            const existing = JSONUtilities.readJson<PackageJson>('./package.json');
            if (existing) {
              packageJson = existing;
            }
          } catch (e: unknown) {
            // JSONUtilities throws "File at path: ... does not exist" when the file is missing.
            // Any other error (malformed JSON, permissions) should propagate.
            if (!(e instanceof Error && e.message.includes('does not exist'))) {
              throw e;
            }
          }

          const mergedDevDependencies = {
            ...(packageJson.devDependencies ?? {}),
            ...this.devDependencies,
            ...GEN2_DEV_DEPENDENCIES,
          };

          // Remove from dependencies any package that will be in devDependencies.
          // Prevents duplicates when custom resource deps overlap with Gen2 dev deps.
          const mergedDependencies = {
            ...(packageJson.dependencies ?? {}),
            ...this.dependencies,
          };
          for (const name of Object.keys(mergedDevDependencies)) {
            delete mergedDependencies[name];
          }
          // Remove CDK v1 scoped packages and Gen1-only helpers that are
          // never valid in Gen2 (may be left over from a previous run).
          for (const name of Object.keys(mergedDependencies)) {
            if (name.startsWith('@aws-cdk/') || name === '@aws-amplify/cli-extensibility-helper') {
              delete mergedDependencies[name];
            }
          }

          const patched: PackageJson = {
            ...packageJson,
            dependencies: sortKeys(mergedDependencies),
            devDependencies: sortKeys(mergedDevDependencies),
          };

          await fs.mkdir(path.dirname(packageJsonPath), { recursive: true });
          await fs.writeFile(packageJsonPath, JSON.stringify(patched, null, 2) + '\n', 'utf-8');
        },
      },
    ];
  }
}
