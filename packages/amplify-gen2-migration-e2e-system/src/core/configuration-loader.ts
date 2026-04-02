/**
 * Configuration loader for managing app-specific migration configurations
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { AppConfiguration, ValidationResult } from '../types';
import { Logger } from '../utils/logger';
import { FileManager } from '../utils/file-manager';

export class ConfigurationLoader implements ConfigurationLoader {
  private readonly appsBasePath: string;
  private readonly configFileName = 'migration-config.json';

  constructor(private readonly logger: Logger, private readonly fileManager: FileManager, appsBasePath = '../../amplify-migration-apps') {
    // Resolve path relative to the project root, not the current file
    this.appsBasePath = path.resolve(process.cwd(), appsBasePath);
  }

  async loadAppConfiguration(appName: string): Promise<AppConfiguration> {
    this.logger.debug(`Loading configuration for app: ${appName}`);

    const configPath = this.getConfigPath(appName);

    if (!(await fs.pathExists(configPath))) {
      throw new Error(`Configuration file not found: ${configPath}. Please create a migration-config.json file for ${appName}.`);
    }

    try {
      const configContent = await this.fileManager.readFile(configPath);
      const rawConfig = JSON.parse(configContent) as Partial<AppConfiguration>;

      const config: AppConfiguration = {
        ...rawConfig,
        app: rawConfig.app!,
        categories: rawConfig.categories!,
      };

      const validationResult = this.validateConfiguration(config);
      if (validationResult.errors.length > 0) {
        this.logger.warn(`Configuration validation failed for ${appName}`);
        this.logger.warn(`${validationResult.errors.join(', ')}`);
        throw Error('App configuration did not pass validation.');
      }

      this.logger.info(`Successfully loaded configuration for ${appName}`);
      return config;
    } catch (error) {
      throw new Error(`Failed to load configuration for ${appName}: ${(error as Error).message}`);
    }
  }

  validateConfiguration(config: AppConfiguration): ValidationResult {
    const errors: string[] = [];

    // Validate app metadata
    if (!config.app) {
      errors.push('App metadata is required');
    } else {
      if (!config.app.name) {
        errors.push('App name is required');
      }
      if (!config.app.framework) {
        errors.push('App framework is required');
      }
    }

    // Validate categories config exists
    if (!config.categories) {
      errors.push('Categories configuration is required');
    }
    return { errors };
  }

  private getConfigPath(appName: string): string {
    return path.join(this.appsBasePath, appName, this.configFileName);
  }
}
