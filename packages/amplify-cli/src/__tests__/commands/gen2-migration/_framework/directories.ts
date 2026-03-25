import * as fs from 'fs-extra';
import * as path from 'path';
import { diff as jestDiff } from 'jest-diff';

/**
 * Represents a single file difference found when comparing two directories.
 *
 * Used by the snapshot comparison to report what changed between the actual
 * migration output and the expected snapshot.
 */
export interface FileDiff {
  /**
   * Path relative to the compared directory root.
   *
   * Example: `"amplify/auth/resource.ts"`, `"package.json"`
   */
  readonly relativePath: string;

  /**
   * The type of difference:
   * - `'missing'`: File exists in expected but not in actual (codegen forgot to generate it).
   * - `'extra'`: File exists in actual but not in expected (codegen generated an unexpected file).
   * - `'modified'`: File exists in both but content differs.
   */
  readonly diffType: 'missing' | 'extra' | 'modified';

  /**
   * For `'modified'` files, a human-readable diff string produced by `jest-diff`.
   * Shows expected vs actual content with color-coded additions and removals.
   * Undefined for `'missing'` and `'extra'` entries.
   */
  readonly diff?: string;
}

/**
 * Options for the `copySync` function.
 */
export interface CopySyncOptions {
  /**
   * Source file or directory path.
   */
  readonly src: string;

  /**
   * Destination file or directory path.
   */
  readonly dest: string;
  /**
   * Regex patterns for entries to skip during copy.
   * Tested against the entry name (not the full path).
   */
  readonly ignorePatterns?: RegExp[];
}

/**
 * Options for the `diff` function.
 */
export interface DiffDirectoriesOptions {
  /**
   * Directory containing the actual migration output.
   */
  readonly actualDir: string;

  /**
   * Directory containing the expected (golden) snapshot files.
   */
  readonly expectedDir: string;
  /**
   * Regex patterns for files/directories to exclude from comparison.
   * Tested against the relative path from the directory root.
   */
  readonly ignorePatterns?: RegExp[];
}

/**
 * Recursively compares two directories and returns an array of differences.
 *
 * The comparison identifies three types of differences:
 * - `missing`: Files present in `expectedDir` but absent from `actualDir`
 *   (the codegen failed to produce an expected file).
 * - `extra`: Files present in `actualDir` but absent from `expectedDir`
 *   (the codegen produced an unexpected file).
 * - `modified`: Files present in both directories but with different content
 *   (includes a `jest-diff` formatted string showing the changes).
 *
 * Files matching any of the `ignorePatterns` regexes are excluded from both
 * sides of the comparison.
 *
 * @param options - The directories to compare and optional ignore patterns.
 * @returns An array of `FileDiff` entries. An empty array means the directories are identical.
 */
export async function diff(options: DiffDirectoriesOptions): Promise<FileDiff[]> {
  const differences: FileDiff[] = [];

  const expectedFiles = await getFilesRecursively(options.expectedDir, '', options.ignorePatterns);
  const actualFiles = await getFilesRecursively(options.actualDir, '', options.ignorePatterns);

  const expectedSet = new Set(expectedFiles);
  const actualSet = new Set(actualFiles);

  // Files only in expected (missing from actual)
  for (const file of expectedFiles) {
    if (!actualSet.has(file)) {
      differences.push({ relativePath: file, diffType: 'missing' });
    }
  }

  // Files only in actual (extra files)
  for (const file of actualFiles) {
    if (!expectedSet.has(file)) {
      differences.push({ relativePath: file, diffType: 'extra' });
    }
  }

  // Files in both - compare content
  for (const file of expectedFiles) {
    if (actualSet.has(file)) {
      const expectedContent = await fs.readFile(path.join(options.expectedDir, file), 'utf-8');
      const actualContent = await fs.readFile(path.join(options.actualDir, file), 'utf-8');

      if (expectedContent !== actualContent) {
        const fileDiff = jestDiff(expectedContent, actualContent, {
          aAnnotation: 'Expected',
          bAnnotation: 'Actual',
        });
        differences.push({
          relativePath: file,
          diff: fileDiff ?? undefined,
          diffType: 'modified',
        });
      }
    }
  }

  return differences;
}

/**
 * Recursively collects all file paths under a directory.
 *
 * @param dir - The absolute directory path to scan.
 * @param base - The relative path prefix (used for recursion; start with `''`).
 * @param ignorePatterns - Optional regex patterns to skip matching entries.
 * @returns An array of relative file paths (e.g., `["amplify/auth/resource.ts", "package.json"]`).
 */
async function getFilesRecursively(dir: string, base = '', ignorePatterns?: RegExp[]): Promise<string[]> {
  const files: string[] = [];
  const entries = await fs.readdir(dir);

  for (const name of entries) {
    const relativePath = path.join(base, name);
    const isIgnored = ignorePatterns?.some((pattern) => pattern.test(relativePath));
    if (isIgnored) {
      continue;
    }
    const fullPath = path.join(dir, name);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      files.push(...(await getFilesRecursively(fullPath, relativePath, ignorePatterns)));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Recursively copies a file or directory from `src` to `dest`.
 *
 * If `src` is a file, it is copied directly (creating parent directories as needed).
 * If `src` is a directory, all entries are copied recursively, skipping any that
 * match the `ignorePatterns` regexes.
 *
 * Used by `MigrationApp.run()` to set up the temp directory and by
 * `Snapshot.update()` to replace the expected snapshot.
 *
 * @param options - Source, destination, and optional ignore patterns.
 */
export function copySync(options: CopySyncOptions): void {
  const { src, dest, ignorePatterns } = options;
  const filter = ignorePatterns
    ? (srcPath: string) => {
        const name = path.basename(srcPath);
        return !ignorePatterns.some((pattern) => pattern.test(name));
      }
    : undefined;
  fs.copySync(src, dest, { filter, recursive: true });
}
