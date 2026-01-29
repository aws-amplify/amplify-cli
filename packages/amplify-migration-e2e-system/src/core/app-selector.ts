/**
 * App selection and management for the Amplify Migration System
 */

import * as path from 'path';
import { IAppSelector, ILogger, IFileManager } from '../interfaces';
import { CLIOptions } from '../types';

export class AppSelector implements IAppSelector {
  private readonly appsBasePath: string;
  private availableApps?: string[];

  constructor(private readonly logger: ILogger, private readonly fileManager: IFileManager, appsBasePath = '../../amplify-migration-apps') {
    // Resolve path relative to the project root, not the current file
    this.appsBasePath = path.resolve(process.cwd(), appsBasePath);
  }

  async discoverAvailableApps(): Promise<string[]> {
    if (this.availableApps) {
      return this.availableApps;
    }

    this.logger.debug('Discovering available apps');

    try {
      if (!(await this.fileManager.pathExists(this.appsBasePath))) {
        throw new Error(`Apps directory does not exist: ${this.appsBasePath}`);
      }

      const appDirectories = await this.fileManager.listDirectories(this.appsBasePath);

      this.availableApps = appDirectories.sort();
      this.logger.info(`Discovered ${this.availableApps.length} available apps: ${this.availableApps.join(', ')}`);

      return this.availableApps;
    } catch (error) {
      throw Error(`Failed to discover available apps: ${error}`);
    }
  }

  async validateAppExists(appName: string): Promise<boolean> {
    this.logger.debug(`Validating app exists: ${appName}`);

    const availableApps = await this.discoverAvailableApps();
    const exists = availableApps.includes(appName);

    if (!exists) {
      this.logger.warn(`App does not exist: ${appName}. Available apps: ${availableApps.join(', ')}`);
    }

    return exists;
  }

  async selectApp(options: CLIOptions): Promise<string> {
    this.logger.debug('Selecting app based on CLI option', { operation: 'selectApp' });

    const availableApps = await this.discoverAvailableApps();

    if (availableApps.length === 0) {
      throw new Error('No valid apps found in the apps directory');
    }

    if (!(await this.validateAppExists(options.app))) {
      throw Error(`Invalid app specified: ${options.app}. Available apps: ${availableApps.join(', ')}`);
    }

    this.logger.info(`Selected apps: ${options.app}`);
    return options.app;
  }

  getAppPath(appName: string): string {
    return path.join(this.appsBasePath, appName);
  }
}
