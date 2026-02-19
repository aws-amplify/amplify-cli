/**
 * File management utilities for the Amplify Migration System
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { IFileManager, ILogger } from '../interfaces';
import { LogContext } from '../types';

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
}
