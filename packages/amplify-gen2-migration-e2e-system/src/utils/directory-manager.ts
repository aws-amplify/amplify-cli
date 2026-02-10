/**
 * Directory management utilities for Amplify app initialization
 * Handles app directory creation, uniqueness guarantees, conflict resolution, and cleanup
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ILogger } from '../interfaces';
import { LogContext } from '../types';

export interface DirectoryCreationOptions {
  /** Base path where the app directory should be created */
  basePath: string;
  /** Name of the app directory to create */
  appName: string;
  /** Permissions to set on the created directory */
  permissions?: string | number;
}

export interface IDirectoryManager {
  createAppDirectory(options: DirectoryCreationOptions): Promise<string>;
  copyDirectory(source: string, destination: string): Promise<void>;
}

export class DirectoryManager implements IDirectoryManager {
  constructor(private readonly logger: ILogger) {}

  async createAppDirectory(options: DirectoryCreationOptions): Promise<string> {
    const context: LogContext = {
      appName: options.appName,
      operation: 'createAppDirectory',
    };

    try {
      this.logger.info(`Creating app directory for ${options.appName}`, context);
      this.logger.debug(`Base path: ${options.basePath}`, context);
      this.logger.debug(`Options: ${JSON.stringify(options, null, 2)}`, context);

      // Ensure base path exists (create if needed for temp directories)
      await fs.ensureDir(options.basePath);

      // Determine the target directory path
      const targetPath = path.join(options.basePath, options.appName);

      // Check if directory already exists
      const exists = await fs.pathExists(targetPath);
      if (exists) {
        throw new Error(`Directory already exists: ${targetPath}`);
      }

      // Create the directory
      await fs.ensureDir(targetPath);
      this.logger.debug(`Directory created: ${targetPath}`, context);

      // Set permissions if specified
      if (options.permissions !== undefined) {
        await fs.chmod(targetPath, options.permissions);
        this.logger.debug(`Set permissions ${options.permissions} on: ${targetPath}`, context);
      }

      this.logger.info(`Successfully created app directory: ${targetPath}`, context);

      return targetPath;
    } catch (error) {
      throw Error(`Failed to create app directory: ${(error as Error).message}`);
    }
  }

  async copyDirectory(source: string, destination: string): Promise<void> {
    const context: LogContext = { operation: 'copyDirectory' };

    try {
      this.logger.debug(`Copying directory: ${source} -> ${destination}`, context);

      // Validate source exists and is a directory
      if (!(await fs.pathExists(source))) {
        throw new Error(`Source directory does not exist: ${source}`);
      }

      const sourceStat = await fs.stat(source);
      if (!sourceStat.isDirectory()) {
        throw new Error(`Source path is not a directory: ${source}`);
      }

      // Ensure destination parent directory exists
      const destinationParent = path.dirname(destination);
      await fs.ensureDir(destinationParent);

      // Copy the directory
      await fs.copy(source, destination, {
        overwrite: false, // Don't overwrite existing files
        errorOnExist: true, // Throw error if destination exists
        preserveTimestamps: true, // Preserve file timestamps
      });

      this.logger.debug(`Successfully copied directory: ${source} -> ${destination}`, context);
    } catch (error) {
      throw Error(`Failed to copy directory: ${source} -> ${destination}. Error: ${error}`);
    }
  }
}
