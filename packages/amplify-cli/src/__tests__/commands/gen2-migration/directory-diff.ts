import * as fs from 'fs-extra';
import * as path from 'path';
import { diff } from 'jest-diff';

interface FileDiff {
  relativePath: string;
  diffType: 'missing' | 'extra' | 'modified';
  diff?: string;
}

export interface CompareDirectoriesOptions {
  readonly actualDir: string;
  readonly expectedDir: string;
  readonly ignorePatterns?: RegExp[];
}

/**
 * Recursively compares two directories and returns formatted diffs.
 */
export async function compareDirectories(options: CompareDirectoriesOptions): Promise<FileDiff[]> {
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
        const fileDiff = diff(expectedContent, actualContent, {
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
