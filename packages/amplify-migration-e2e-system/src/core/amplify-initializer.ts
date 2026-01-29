/**
 * Amplify Initializer for executing amplify init programmatically
 * Uses the e2e-core utilities for reliable amplify init execution
 */

import { ILogger, IAppInitializer, InitializeAppOptions } from '../interfaces';
import { AppConfiguration, LogContext } from '../types';
import { initJSProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import path from 'path';
import fs from 'fs';

export interface AmplifyInitSettings {
  name: string;
  envName: string;
  editor: string;
  framework: string;
  srcDir: string;
  distDir: string;
  buildCmd: string;
  startCmd: string;
  profileName?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  sessionToken?: string;
  includeGen2RecommendationPrompt?: boolean;
  includeUsageDataPrompt?: boolean;
}

interface BuildInitSettingsOptions {
  config: AppConfiguration;
  deploymentName: string;
  envName?: string;
  profile: string;
}

export class AmplifyInitializer implements IAppInitializer {
  constructor(private readonly logger: ILogger) {}

  async initializeApp(options: InitializeAppOptions): Promise<void> {
    const { appPath, config, deploymentName, envName, profile } = options;

    const context: LogContext = { appName: deploymentName, operation: 'initializeApp' };

    this.logger.info(`Starting amplify init for ${deploymentName} (config: ${config.app.name})`, context);
    this.logger.debug(`App path: ${appPath}`, context);
    this.logger.debug(`Configuration: ${JSON.stringify(config, null, 2)}`, context);
    this.logger.debug(`Deployment name: ${deploymentName}`, context);

    const appNameValidation = this.validateAppName(deploymentName);
    if (!appNameValidation.valid) {
      throw Error(`Invalid app name: ${appNameValidation.error}`);
    }

    if (envName) {
      const amplifyEnvNameValidation = this.validateEnvName(envName);
      if (!amplifyEnvNameValidation.valid) {
        throw Error(`Invalid env name: ${amplifyEnvNameValidation.error}`);
      }
    }

    const startTime = Date.now();
    try {
      this.logger.info(`Calling initJSProjectWithProfile...`, context);
      const settings = this.buildInitSettings({ config, deploymentName, profile, envName });
      this.logger.debug(`Init settings: ${JSON.stringify(settings, null, 2)}`, context);
      await initJSProjectWithProfile(appPath, settings);

      const duration = Date.now() - startTime;
      this.logger.info(`Successfully initialized Amplify app in ${appPath}, ${deploymentName} (took ${duration}ms)`, context);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logErrorDetails(error as Error, context);
      throw Error(`Failed to initialize Amplify app: ${deploymentName} (failed after ${duration}ms)`);
    }
  }

  private logErrorDetails(error: Error, context: LogContext): void {
    this.logger.debug(`Error details:`, context);
    this.logger.debug(`- Error name: ${error.name}`, context);
    this.logger.debug(`- Error message: ${error.message}`, context);
    this.logger.debug(`- Error stack: ${error.stack}`, context);
  }

  async createAppDirectory(basePath: string, appName: string): Promise<string> {
    const context: LogContext = { appName, operation: 'createAppDirectory' };
    this.logger.info(`Creating app directory for ${appName}`, context);

    const appPath = path.join(basePath, appName);

    try {
      // Ensure the directory exists
      await fs.promises.mkdir(appPath, { recursive: true });
      this.logger.debug(`Created app directory: ${appPath}`, context);
      return appPath;
    } catch (error) {
      this.logger.error(`Failed to create app directory: ${appPath}`, error as Error, context);
      throw error;
    }
  }

  validateAppName(appName: string): { valid: boolean; error?: string } {
    // Amplify app names must be alphanumeric only, 3-20 characters
    if (!appName) {
      return { valid: false, error: 'App name is required' };
    }

    if (appName.length < 3 || appName.length > 20) {
      return { valid: false, error: 'App name must be between 3-20 characters' };
    }

    // Check for alphanumeric only (no dashes, underscores, or special characters)
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(appName)) {
      return {
        valid: false,
        error: `App name not valid: ${appName}. App name must contain only alphanumeric characters (a-z, A-Z, 0-9). No dashes, underscores, or special characters allowed`,
      };
    }

    return { valid: true };
  }

  validateEnvName(envName: string): { valid: boolean; error?: string } {
    // Env names must be lowercase letters only, 2-10 characters
    if (!envName) {
      return { valid: false, error: 'Env name is required' };
    }

    const isValid = /^[a-z]{2,10}$/.test(envName);
    if (!isValid) {
      return {
        valid: false,
        error: `Env name not valid: ${envName}. Env name must be 2-10 lowercase letters only (a-z). No numbers, dashes, underscores, or special characters allowed`,
      };
    }

    return { valid: true };
  }

  private buildInitSettings(options: BuildInitSettingsOptions): Partial<AmplifyInitSettings> {
    const { config, deploymentName, profile, envName } = options;

    const settings = {
      name: deploymentName,
      envName: envName ?? 'main', // Default environment name
      editor: 'Visual Studio Code',
      framework: config.app.framework ?? 'react',
      srcDir: 'src',
      distDir: 'dist',
      buildCmd: 'npm run build',
      startCmd: 'npm run start',
      disableAmplifyAppCreation: false, // always create app in Amplify console
      profileName: profile,
    };

    // Log the settings being used
    const context: LogContext = { appName: deploymentName, operation: 'buildInitSettings' };
    this.logger.debug(`Built init settings for ${deploymentName} (config: ${config.app.name}):`, context);
    this.logger.debug(`- Name: ${settings.name}`, context);
    this.logger.debug(`- Environment: ${settings.envName}`, context);
    this.logger.debug(`- Using default selections for editor, framework, etc.`, context);

    return settings;
  }
}
