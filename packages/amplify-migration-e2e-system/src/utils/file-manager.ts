/**
 * File management utilities for the Amplify Migration System
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import { IFileManager, ILogger } from '../interfaces';
import { LogContext } from '../types';
import { tmpdir } from 'os';

export class FileManager implements IFileManager {
  constructor(private readonly logger: ILogger) {}

  async readFile(filePath: string): Promise<string> {
    const context: LogContext = { operation: 'readFile' };

    try {
      this.logger.debug(`Reading file: ${filePath}`, context);

      if (!(await fs.pathExists(filePath))) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const content = await fs.readFile(filePath, 'utf-8');
      this.logger.debug(`Successfully read file: ${filePath} (${content.length} chars)`, context);

      return content;
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, error as Error, context);
      throw error;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const context: LogContext = { operation: 'writeFile' };

    try {
      this.logger.debug(`Writing file: ${filePath} (${content.length} chars)`, context);

      // Ensure directory exists
      await this.ensureDirectory(path.dirname(filePath));

      await fs.writeFile(filePath, content, 'utf-8');
      this.logger.debug(`Successfully wrote file: ${filePath}`, context);
    } catch (error) {
      this.logger.error(`Failed to write file: ${filePath}`, error as Error, context);
      throw error;
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    const context: LogContext = { operation: 'copyFile' };

    try {
      this.logger.debug(`Copying file: ${source} -> ${destination}`, context);

      if (!(await fs.pathExists(source))) {
        throw new Error(`Source file does not exist: ${source}`);
      }

      // Ensure destination directory exists
      await this.ensureDirectory(path.dirname(destination));

      await fs.copy(source, destination);
      this.logger.debug(`Successfully copied file: ${source} -> ${destination}`, context);
    } catch (error) {
      this.logger.error(`Failed to copy file: ${source} -> ${destination}`, error as Error, context);
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const context: LogContext = { operation: 'deleteFile' };

    try {
      this.logger.debug(`Deleting file: ${filePath}`, context);

      if (!(await fs.pathExists(filePath))) {
        this.logger.warn(`File does not exist, skipping deletion: ${filePath}`, context);
        return;
      }

      await fs.remove(filePath);
      this.logger.debug(`Successfully deleted file: ${filePath}`, context);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${filePath}`, error as Error, context);
      throw error;
    }
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    const context: LogContext = { operation: 'ensureDirectory' };

    try {
      this.logger.debug(`Ensuring directory exists: ${dirPath}`, context);

      await fs.ensureDir(dirPath);
      this.logger.debug(`Directory ensured: ${dirPath}`, context);
    } catch (error) {
      this.logger.error(`Failed to ensure directory: ${dirPath}`, error as Error, context);
      throw error;
    }
  }

  async listFiles(dirPath: string, pattern?: string): Promise<string[]> {
    const context: LogContext = { operation: 'listFiles' };

    try {
      this.logger.debug(`Listing files in: ${dirPath}${pattern ? ` (pattern: ${pattern})` : ''}`, context);

      if (!(await fs.pathExists(dirPath))) {
        throw new Error(`Directory does not exist: ${dirPath}`);
      }

      const stat = await fs.stat(dirPath);
      if (!stat.isDirectory()) {
        throw new Error(`Path is not a directory: ${dirPath}`);
      }

      let files: string[];

      if (pattern) {
        // Use glob pattern matching
        const globPattern = path.join(dirPath, pattern);
        files = await glob(globPattern);
        // Convert absolute paths to relative paths from dirPath
        files = files.map((file) => path.relative(dirPath, file));
      } else {
        // List all files in directory
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        files = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
      }

      this.logger.debug(`Found ${files.length} files in: ${dirPath}`, context);
      return files.sort();
    } catch (error) {
      this.logger.error(`Failed to list files in: ${dirPath}`, error as Error, context);
      throw error;
    }
  }

  async listDirectories(dirPath: string): Promise<string[]> {
    const context: LogContext = { operation: 'listDirectories' };

    try {
      this.logger.debug(`Listing directories in: ${dirPath}`, context);

      if (!(await fs.pathExists(dirPath))) {
        throw new Error(`Directory does not exist: ${dirPath}`);
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const directories = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

      this.logger.debug(`Found ${directories.length} directories in: ${dirPath}`, context);
      return directories;
    } catch (error) {
      this.logger.error(`Failed to list directories in: ${dirPath}`, error as Error, context);
      throw error;
    }
  }

  async pathExists(filePath: string): Promise<boolean> {
    try {
      return await fs.pathExists(filePath);
    } catch (error) {
      this.logger.debug(`Error checking path existence: ${filePath}`, { operation: 'pathExists' });
      return false;
    }
  }

  async isDirectory(dirPath: string): Promise<boolean> {
    try {
      if (!(await this.pathExists(dirPath))) {
        return false;
      }

      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch (error) {
      this.logger.debug(`Error checking if path is directory: ${dirPath}`, { operation: 'isDirectory' });
      return false;
    }
  }

  async isFile(filePath: string): Promise<boolean> {
    try {
      if (!(await this.pathExists(filePath))) {
        return false;
      }

      const stat = await fs.stat(filePath);
      return stat.isFile();
    } catch (error) {
      this.logger.debug(`Error checking if path is file: ${filePath}`, { operation: 'isFile' });
      return false;
    }
  }

  async getFileSize(filePath: string): Promise<number> {
    const context: LogContext = { operation: 'getFileSize' };

    try {
      if (!(await this.pathExists(filePath))) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const stat = await fs.stat(filePath);
      return stat.size;
    } catch (error) {
      this.logger.error(`Failed to get file size: ${filePath}`, error as Error, context);
      throw error;
    }
  }

  async getLastModified(filePath: string): Promise<Date> {
    const context: LogContext = { operation: 'getLastModified' };

    try {
      if (!(await this.pathExists(filePath))) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const stat = await fs.stat(filePath);
      return stat.mtime;
    } catch (error) {
      this.logger.error(`Failed to get last modified time: ${filePath}`, error as Error, context);
      throw error;
    }
  }

  async createTempDirectory(prefix = 'amplify-migration-'): Promise<string> {
    const context: LogContext = { operation: 'createTempDirectory' };

    try {
      const tempDir = await fs.mkdtemp(path.join(tmpdir(), prefix));
      this.logger.debug(`Created temporary directory: ${tempDir}`, context);
      return tempDir;
    } catch (error) {
      this.logger.error('Failed to create temporary directory', error as Error, context);
      throw error;
    }
  }

  async cleanupTempDirectory(tempDir: string): Promise<void> {
    const context: LogContext = { operation: 'cleanupTempDirectory' };

    try {
      if (await this.pathExists(tempDir)) {
        await fs.remove(tempDir);
        this.logger.debug(`Cleaned up temporary directory: ${tempDir}`, context);
      }
    } catch (error) {
      this.logger.warn(`Failed to cleanup temporary directory: ${tempDir}`, context);
      // Don't throw - cleanup failures shouldn't break the main flow
    }
  }

  async readJsonFile<T = unknown>(filePath: string): Promise<T> {
    const context: LogContext = { operation: 'readJsonFile' };

    try {
      this.logger.debug(`Reading JSON file: ${filePath}`, context);

      const content = await this.readFile(filePath);
      const parsed = JSON.parse(content) as T;

      this.logger.debug(`Successfully parsed JSON file: ${filePath}`, context);
      return parsed;
    } catch (error) {
      this.logger.error(`Failed to read JSON file: ${filePath}`, error as Error, context);
      throw error;
    }
  }

  async writeJsonFile<T = unknown>(filePath: string, data: T, spaces = 2): Promise<void> {
    const context: LogContext = { operation: 'writeJsonFile' };

    try {
      this.logger.debug(`Writing JSON file: ${filePath}`, context);

      const content = JSON.stringify(data, null, spaces);
      await this.writeFile(filePath, content);

      this.logger.debug(`Successfully wrote JSON file: ${filePath}`, context);
    } catch (error) {
      this.logger.error(`Failed to write JSON file: ${filePath}`, error as Error, context);
      throw error;
    }
  }

  resolveRelativePath(basePath: string, relativePath: string): string {
    return path.resolve(basePath, relativePath);
  }

  getRelativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  joinPaths(...paths: string[]): string {
    return path.join(...paths);
  }

  getFileName(filePath: string): string {
    return path.basename(filePath);
  }

  getFileExtension(filePath: string): string {
    return path.extname(filePath);
  }

  getDirectoryName(filePath: string): string {
    return path.dirname(filePath);
  }
}
