/**
 * App selection and management for the Amplify Migration System
 */

import * as path from 'path';
import { IAppSelector, ILogger, IFileManager } from '../interfaces';
import { CLIOptions } from '../types';

export class AppSelector implements IAppSelector {
  private readonly appsBasePath: string;
  private availableApps?: string[];

  constructor(private readonly logger: ILogger, private readonly fileManager: IFileManager, appsBasePath = '../amplify-migration-apps') {
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

      const directories = await this.fileManager.listDirectories(this.appsBasePath);

      // Filter for app directories (app-0, app-1, etc.)
      const appDirectories = directories.filter((dir: string) => /^app-\d+$/.test(dir));

      // Validate each app directory
      const validApps: string[] = [];
      for (const appDir of appDirectories) {
        if (await this.validateAppDirectory(appDir)) {
          validApps.push(appDir);
        } else {
          this.logger.warn(`Invalid app directory found: ${appDir}`);
        }
      }

      this.availableApps = validApps.sort();
      this.logger.info(`Discovered ${this.availableApps.length} available apps: ${this.availableApps.join(', ')}`);

      return this.availableApps;
    } catch (error) {
      this.logger.error('Failed to discover available apps', error as Error);
      throw error;
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

  async selectApps(options: CLIOptions): Promise<string[]> {
    this.logger.debug('Selecting apps based on CLI options', { operation: 'selectApps' });

    const availableApps = await this.discoverAvailableApps();

    if (availableApps.length === 0) {
      throw new Error('No valid apps found in the apps directory');
    }

    // If specific apps are requested
    if (options.apps && options.apps.length > 0) {
      const requestedApps = options.apps;
      const validApps: string[] = [];
      const invalidApps: string[] = [];

      for (const appName of requestedApps) {
        if (await this.validateAppExists(appName)) {
          validApps.push(appName);
        } else {
          invalidApps.push(appName);
        }
      }

      if (invalidApps.length > 0) {
        const errorMessage = `Invalid apps specified: ${invalidApps.join(', ')}. Available apps: ${availableApps.join(', ')}`;
        this.logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      this.logger.info(`Selected apps: ${validApps.join(', ')}`);
      return validApps;
    }

    // If no specific apps requested, prompt user or return all
    if (this.isInteractiveMode()) {
      return await this.promptForAppSelection(availableApps);
    } else {
      // Non-interactive mode - return all apps
      this.logger.info(`No specific apps requested, selecting all available apps: ${availableApps.join(', ')}`);
      return availableApps;
    }
  }

  getAppPath(appName: string): string {
    return path.join(this.appsBasePath, appName);
  }

  getAppReadmePath(appName: string): string {
    return path.join(this.getAppPath(appName), 'README.md');
  }

  getAppConfigPath(appName: string): string {
    return path.join(this.getAppPath(appName), 'migration-config.json');
  }

  async getAppMetadata(appName: string): Promise<Record<string, unknown>> {
    const appPath = this.getAppPath(appName);
    const readmePath = this.getAppReadmePath(appName);
    const configPath = this.getAppConfigPath(appName);

    const metadata: Record<string, unknown> = {
      name: appName,
      path: appPath,
      exists: await this.fileManager.pathExists(appPath),
      hasReadme: await this.fileManager.pathExists(readmePath),
      hasConfig: await this.fileManager.pathExists(configPath),
    };

    if (metadata.hasReadme) {
      try {
        const readmeContent = await this.fileManager.readFile(readmePath);
        metadata.readmeSize = readmeContent.length;
        metadata.description = this.extractDescriptionFromReadme(readmeContent);
      } catch (error) {
        this.logger.warn(`Failed to read README for ${appName}`, { appName });
      }
    }

    if (metadata.hasConfig) {
      try {
        const configContent = await this.fileManager.readJsonFile(configPath);
        metadata.config = configContent;
      } catch (error) {
        this.logger.warn(`Failed to read config for ${appName}`, { appName });
      }
    }

    return metadata;
  }

  private async validateAppDirectory(appName: string): Promise<boolean> {
    const appPath = this.getAppPath(appName);

    // Check if directory exists
    if (!(await this.fileManager.pathExists(appPath))) {
      return false;
    }

    // Check if it's actually a directory
    if (!(await this.fileManager.isDirectory(appPath))) {
      return false;
    }

    // Check for required files (at least README.md should exist)
    const readmePath = this.getAppReadmePath(appName);
    if (!(await this.fileManager.pathExists(readmePath))) {
      this.logger.warn(`App ${appName} missing README.md`);
      return false;
    }

    // Check for package.json (Amplify apps should have this)
    const packageJsonPath = path.join(appPath, 'package.json');
    if (!(await this.fileManager.pathExists(packageJsonPath))) {
      this.logger.warn(`App ${appName} missing package.json`);
      // Don't fail validation for missing package.json as some apps might not have it initially
    }

    return true;
  }

  private async promptForAppSelection(availableApps: string[]): Promise<string[]> {
    const inquirer = require('inquirer');

    this.logger.info('Interactive app selection mode');

    const choices = await Promise.all(
      availableApps.map(async (appName) => {
        const metadata = await this.getAppMetadata(appName);
        const description = (metadata.description as string) || 'No description available';
        return {
          name: `${appName} - ${description}`,
          value: appName,
          short: appName,
        };
      }),
    );

    const answers = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selectedApps',
        message: 'Select apps to migrate:',
        choices: [
          ...choices,
          new inquirer.Separator(),
          {
            name: 'Select All',
            value: '__ALL__',
          },
        ],
        validate: (input: string[]) => {
          if (input.length === 0) {
            return 'Please select at least one app';
          }
          return true;
        },
      },
    ]);

    let selectedApps = answers.selectedApps as string[];

    // Handle "Select All" option
    if (selectedApps.includes('__ALL__')) {
      selectedApps = availableApps;
    }

    this.logger.info(`User selected apps: ${selectedApps.join(', ')}`);
    return selectedApps;
  }

  private isInteractiveMode(): boolean {
    // Check if we're in a TTY (interactive terminal)
    return process.stdin.isTTY && process.stdout.isTTY;
  }

  private extractDescriptionFromReadme(content: string): string {
    const lines = content.split('\n');

    // Look for the first heading
    const titleLine = lines.find((line) => line.startsWith('# '));
    if (titleLine) {
      return titleLine.replace('# ', '').trim();
    }

    // Fallback to first non-empty line
    const firstLine = lines.find((line) => line.trim().length > 0);
    return firstLine?.trim() || 'No description available';
  }

  async getAllAppMetadata(): Promise<Map<string, Record<string, unknown>>> {
    const availableApps = await this.discoverAvailableApps();
    const metadata = new Map<string, Record<string, unknown>>();

    for (const appName of availableApps) {
      try {
        const appMetadata = await this.getAppMetadata(appName);
        metadata.set(appName, appMetadata);
      } catch (error) {
        this.logger.warn(`Failed to get metadata for ${appName}`, { appName });
        metadata.set(appName, { name: appName, error: (error as Error).message });
      }
    }

    return metadata;
  }

  async validateAllApps(): Promise<Map<string, boolean>> {
    const availableApps = await this.discoverAvailableApps();
    const validationResults = new Map<string, boolean>();

    for (const appName of availableApps) {
      const isValid = await this.validateAppDirectory(appName);
      validationResults.set(appName, isValid);
    }

    return validationResults;
  }
}
