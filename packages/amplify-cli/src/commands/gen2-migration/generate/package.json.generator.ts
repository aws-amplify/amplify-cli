import path from 'node:path';
import fs from 'node:fs/promises';
import { coerce, gt } from 'semver';
import { Planner } from '../_common/planner';
import { AmplifyMigrationOperation } from '../_common/operation';
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
  typescript: '~5.9.3',
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
 * Returns the higher of two semver version strings. Falls back to
 * `incoming` when either value cannot be coerced to a valid semver
 * (e.g. `*`, `latest`, git URLs).
 */
function maxVersion(existing: string | undefined, incoming: string): string {
  if (!existing) {
    return incoming;
  }
  const coercedExisting = coerce(existing);
  const coercedIncoming = coerce(incoming);
  if (coercedExisting && coercedIncoming) {
    return gt(coercedIncoming, coercedExisting) ? incoming : existing;
  }
  return incoming;
}

/**
 * Accumulates dependencies from category generators and writes the
 * root package.json with Gen2 TypeScript dependencies.
 *
 * Category generators call `addDependency()` and `addDevDependency()`
 * during their `plan()` phase. When the same package is added more
 * than once, the higher semver version is retained.
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
    this.dependencies[name] = maxVersion(this.dependencies[name], version);
  }

  /**
   * Adds a dev dependency.
   */
  public addDevDependency(name: string, version: string): void {
    this.devDependencies[name] = maxVersion(this.devDependencies[name], version);
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

          const mergedDevDependencies: Record<string, string> = {
            ...(packageJson.devDependencies ?? {}),
          };
          for (const [name, version] of Object.entries(this.devDependencies)) {
            mergedDevDependencies[name] = maxVersion(mergedDevDependencies[name], version);
          }
          for (const [name, version] of Object.entries(GEN2_DEV_DEPENDENCIES)) {
            mergedDevDependencies[name] = maxVersion(mergedDevDependencies[name], version);
          }

          // Remove from devDependencies any package that is also in
          // dependencies. Runtime deps take precedence — npm/yarn makes
          // them available in both contexts.
          const mergedDependencies: Record<string, string> = {
            ...(packageJson.dependencies ?? {}),
          };
          for (const [name, version] of Object.entries(this.dependencies)) {
            mergedDependencies[name] = maxVersion(mergedDependencies[name], version);
          }
          for (const name of Object.keys(mergedDependencies)) {
            delete mergedDevDependencies[name];
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
