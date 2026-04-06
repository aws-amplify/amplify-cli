/**
 * File management utilities for the Amplify Migration System
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from './logger';

export class FileManager {
  constructor(private readonly logger: Logger) {}

  async readFile(filePath: string): Promise<string> {
    try {
      this.logger.debug(`Reading file: ${filePath}`);

      if (!(await fs.pathExists(filePath))) {
        throw new Error(`File does not exist: ${filePath}`);
      }

      const content = await fs.readFile(filePath, 'utf-8');
      this.logger.debug(`Successfully read file: ${filePath} (${content.length} chars)`);

      return content;
    } catch (error) {
      this.logger.error(`Failed to read file: ${filePath}`, error as Error);
      throw error;
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      this.logger.debug(`Writing file: ${filePath} (${content.length} chars)`);

      // Ensure directory exists
      await this.ensureDirectory(path.dirname(filePath));

      await fs.writeFile(filePath, content, 'utf-8');
      this.logger.debug(`Successfully wrote file: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to write file: ${filePath}`, error as Error);
      throw error;
    }
  }

  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      this.logger.debug(`Ensuring directory exists: ${dirPath}`);

      await fs.ensureDir(dirPath);
      this.logger.debug(`Directory ensured: ${dirPath}`);
    } catch (error) {
      this.logger.error(`Failed to ensure directory: ${dirPath}`, error as Error);
      throw error;
    }
  }

  async listDirectories(dirPath: string): Promise<string[]> {
    try {
      this.logger.debug(`Listing directories in: ${dirPath}`);

      if (!(await fs.pathExists(dirPath))) {
        throw new Error(`Directory does not exist: ${dirPath}`);
      }

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const directories = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();

      this.logger.debug(`Found ${directories.length} directories in: ${dirPath}`);
      return directories;
    } catch (error) {
      this.logger.error(`Failed to list directories in: ${dirPath}`, error as Error);
      throw error;
    }
  }

  async pathExists(filePath: string): Promise<boolean> {
    try {
      return await fs.pathExists(filePath);
    } catch (error) {
      this.logger.debug(`Error checking path existence: ${filePath}`);
      return false;
    }
  }
}
