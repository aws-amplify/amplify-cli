/**
 * Configuration loader for managing app-specific migration configurations
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { IConfigurationLoader, ILogger, IFileManager } from '../interfaces';
import { AppConfiguration, ValidationResult } from '../types';

export class ConfigurationLoader implements IConfigurationLoader {
  private readonly appsBasePath: string;
  private readonly configFileName = 'migration-config.json';

  constructor(private readonly logger: ILogger, private readonly fileManager: IFileManager, appsBasePath = '../../amplify-migration-apps') {
    // Resolve path relative to the project root, not the current file
    this.appsBasePath = path.resolve(process.cwd(), appsBasePath);
  }

  async loadAppConfiguration(appName: string): Promise<AppConfiguration> {
    this.logger.debug(`Loading configuration for app: ${appName}`, { appName });

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

      this.logger.info(`Successfully loaded configuration for ${appName}`, { appName });
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

    // Validate categories
    if (!config.categories) {
      errors.push('Categories configuration is required');
    } else {
      // Validate API configuration
      if (config.categories.api) {
        const apiErrors = this.validateAPIConfiguration(config.categories.api);
        errors.push(...apiErrors);
      }

      // Validate Auth configuration
      if (config.categories.auth) {
        const authErrors = this.validateAuthConfiguration(config.categories.auth);
        errors.push(...authErrors);
      }

      // Validate Storage configuration
      if (config.categories.storage) {
        const storageErrors = this.validateStorageConfiguration(config.categories.storage);
        errors.push(...storageErrors);
      }

      // Validate Function configuration
      if (config.categories.function) {
        const functionErrors = this.validateFunctionConfiguration(config.categories.function);
        errors.push(...functionErrors);
      }

      // Validate Hosting configuration
      if (config.categories.hosting) {
        const hostingErrors = this.validateHostingConfiguration(config.categories.hosting);
        errors.push(...hostingErrors);
      }
    }

    return { errors };
  }

  async saveConfiguration(appName: string, config: AppConfiguration): Promise<void> {
    const configPath = this.getConfigPath(appName);

    try {
      await this.fileManager.ensureDirectory(path.dirname(configPath));
      await this.fileManager.writeFile(configPath, JSON.stringify(config, null, 2));
      this.logger.info(`Saved configuration for ${appName}`, { appName });
    } catch (error) {
      this.logger.error(`Failed to save configuration for ${appName}`, error as Error, { appName });
      throw error;
    }
  }

  private getConfigPath(appName: string): string {
    return path.join(this.appsBasePath, appName, this.configFileName);
  }

  // Validation helper methods
  private validateAPIConfiguration(config: unknown): string[] {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('API configuration must be an object');
      return errors;
    }

    const apiConfig = config as Record<string, unknown>;

    if (!apiConfig.type || !['GraphQL', 'REST'].includes(apiConfig.type as string)) {
      errors.push('API type must be either GraphQL or REST');
    }

    if (!apiConfig.authModes || !Array.isArray(apiConfig.authModes)) {
      errors.push('API authModes must be an array');
    }

    return errors;
  }

  private validateAuthConfiguration(config: unknown): string[] {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Auth configuration must be an object');
      return errors;
    }

    const authConfig = config as Record<string, unknown>;

    if (!authConfig.signInMethods || !Array.isArray(authConfig.signInMethods)) {
      errors.push('Auth signInMethods must be an array');
    }

    if (!authConfig.socialProviders || !Array.isArray(authConfig.socialProviders)) {
      errors.push('Auth socialProviders must be an array');
    }

    return errors;
  }

  private validateStorageConfiguration(config: unknown): string[] {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Storage configuration must be an object');
      return errors;
    }

    const storageConfig = config as Record<string, unknown>;

    if (!storageConfig.buckets || !Array.isArray(storageConfig.buckets)) {
      errors.push('Storage buckets must be an array');
    } else {
      storageConfig.buckets.forEach((bucket: unknown, index: number) => {
        if (!bucket || typeof bucket !== 'object') {
          errors.push(`Storage bucket at index ${index} must be an object`);
          return;
        }

        const bucketConfig = bucket as Record<string, unknown>;
        if (!bucketConfig.name) {
          errors.push(`Storage bucket at index ${index} must have a name`);
        }
        if (!bucketConfig.access || !Array.isArray(bucketConfig.access)) {
          errors.push(`Storage bucket at index ${index} must have access array`);
        }
      });
    }

    return errors;
  }

  private validateFunctionConfiguration(config: unknown): string[] {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Function configuration must be an object');
      return errors;
    }

    const functionConfig = config as Record<string, unknown>;

    if (!functionConfig.functions || !Array.isArray(functionConfig.functions)) {
      errors.push('Function functions must be an array');
    } else {
      functionConfig.functions.forEach((func: unknown, index: number) => {
        if (!func || typeof func !== 'object') {
          errors.push(`Function at index ${index} must be an object`);
          return;
        }

        const funcConfig = func as Record<string, unknown>;
        if (!funcConfig.name) {
          errors.push(`Function at index ${index} must have a name`);
        }
        if (!funcConfig.runtime) {
          errors.push(`Function at index ${index} must have a runtime`);
        }
      });
    }

    return errors;
  }

  private validateHostingConfiguration(config: unknown): string[] {
    const errors: string[] = [];

    if (!config || typeof config !== 'object') {
      errors.push('Hosting configuration must be an object');
      return errors;
    }

    const hostingConfig = config as Record<string, unknown>;

    if (!hostingConfig.type || !['amplify-console', 's3-cloudfront'].includes(hostingConfig.type as string)) {
      errors.push('Hosting type must be either amplify-console or s3-cloudfront');
    }

    return errors;
  }
}
