import fs from 'node:fs/promises';

/** Checks if a file or directory exists at the given path. */
export async function fileOrDirectoryExists(targetPath: string): Promise<boolean> {
  return fs
    .access(targetPath)
    .then(() => true)
    .catch(() => false);
}
