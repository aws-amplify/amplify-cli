/**
 * File service for file I/O operations
 * Handles reading and writing files
 */

import * as fs from 'fs-extra';
import { printer } from '@aws-amplify/amplify-prompts';

/**
 * Service for file operations
 */
export class FileService {
  /**
   * Save JSON data to a file
   */
  public async saveJsonOutput(filePath: string, data: any): Promise<void> {
    await fs.writeJson(filePath, data, { spaces: 2 });
    printer.info(`Drift results saved to: ${filePath}`);
  }

  /**
   * Load JSON data from a file
   */
  public async loadJsonFile(filePath: string): Promise<any> {
    return fs.readJson(filePath);
  }

  /**
   * Check if a file exists
   */
  public async fileExists(filePath: string): Promise<boolean> {
    return fs.pathExists(filePath);
  }
}
