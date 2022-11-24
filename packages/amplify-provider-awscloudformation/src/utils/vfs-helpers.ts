import { Stats } from 'fs';
/* eslint-disable spellcheck/spell-checker */
import * as fs from 'fs-extra';
import { fs as vfs } from 'memfs';
import * as path from 'path';
import { pathManager } from 'amplify-cli-core';

/**
 * Creates a virtual file system snapshot with the contents of the amplify backend project
 */
export const takeBackendSnapshotVFS = (): void => {
  const sourceDir = path.normalize(path.join(pathManager.getBackendDirPath()));
  const targetDir = path.normalize(path.join(pathManager.getBackendSnapshotVFSPath()));
  copyFromFStoVFSSync(sourceDir, targetDir);
};

/**
 * Copies a directory from the file system to the virtual file system
 */
const copyFromFStoVFSSync = (src: string, dest: string): void => {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && (stats as Stats).isDirectory();
  if (isDirectory) {
    vfs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyFromFStoVFSSync(path.join(src, childItemName),
        path.join(dest, childItemName));
    });
  } else {
    vfs.writeFileSync(dest, fs.readFileSync(src));
  }
};

/**
 * Deletes the backend snapshot form the virtual file system
 */
export const deleteBackendSnapshotVFS = (): void => {
  const targetDir = path.normalize(path.join(pathManager.getBackendSnapshotVFSPath()));
  if (vfs.existsSync(targetDir)) { removeVFSDirRecursive(targetDir); }
};

const removeVFSDirRecursive = (directoryPath: string): void => {
  if (vfs.existsSync(directoryPath)) {
    vfs.readdirSync(directoryPath).forEach(file => {
      const curPath = path.join(directoryPath, file);
      if (vfs.lstatSync(curPath).isDirectory()) {
        removeVFSDirRecursive(curPath);
      } else {
        vfs.unlinkSync(curPath);
      }
    });
    vfs.rmdirSync(directoryPath);
  }
};

/**
 * Checks for existance of file in the virtual file system
 */
export const existsVFSSync = (src: string): boolean => vfs.existsSync(src);

/**
 * Copies a directory from the virtual file system to the file system
 */
export const copyFromVFStoFSSync = (src: string, dest: string): void => {
  const exists = vfs.existsSync(src);
  const stats = exists && vfs.statSync(src);
  const isDirectory = exists && (stats as Stats).isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, { recursive: true });
    vfs.readdirSync(src).forEach(childItemName => {
      copyFromVFStoFSSync(path.join(src, childItemName),
        path.join(dest, childItemName));
    });
  } else {
    fs.writeFileSync(dest, vfs.readFileSync(src));
  }
};
