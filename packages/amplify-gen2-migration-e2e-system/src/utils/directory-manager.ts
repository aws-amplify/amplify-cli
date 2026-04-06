/**
 * Directory management utilities for Amplify app initialization
 * Handles app directory creation, uniqueness guarantees, conflict resolution, and cleanup
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { Logger } from './logger';

export interface DirectoryCreationOptions {
  /** Base path where the app directory should be created */
  basePath: string;
  /** Name of the app directory to create */
  appName: string;
  /** Permissions to set on the created directory */
  permissions?: string | number;
}

export class DirectoryManager {
  constructor(private readonly logger: Logger) {}

  async createAppDirectory(options: DirectoryCreationOptions): Promise<string> {
    try {
      this.logger.info(`Creating app directory for ${options.appName}`);
      this.logger.debug(`Base path: ${options.basePath}`);
      this.logger.debug(`Options: ${JSON.stringify(options, null, 2)}`);

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
      this.logger.debug(`Directory created: ${targetPath}`);

      // Set permissions if specified
      if (options.permissions !== undefined) {
        await fs.chmod(targetPath, options.permissions);
        this.logger.debug(`Set permissions ${options.permissions} on: ${targetPath}`);
      }

      this.logger.info(`Successfully created app directory: ${targetPath}`);

      return targetPath;
    } catch (error) {
      throw Error(`Failed to create app directory: ${(error as Error).message}`);
    }
  }

  async copyDirectory(source: string, destination: string): Promise<void> {
    try {
      this.logger.debug(`Copying directory: ${source} -> ${destination}`);

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        filter: async (src: string, _dest: string) => {
          return !src.includes('_snapshot') && !src.includes('node_modules');
        },
      });

      this.logger.debug(`Successfully copied directory: ${source} -> ${destination}`);
    } catch (error) {
      throw Error(`Failed to copy directory: ${source} -> ${destination}. Error: ${error}`);
    }
  }
}
