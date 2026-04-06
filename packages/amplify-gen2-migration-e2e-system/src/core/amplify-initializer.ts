/**
 * Amplify Initializer for executing amplify init programmatically
 * Uses the e2e-core utilities for reliable amplify init execution
 */

import { AppConfiguration } from '../types';
import { initJSProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import { Logger } from '../utils/logger';

export interface InitializeAppOptions {
  appPath: string;
  config: AppConfiguration;
  deploymentName: string;
  /** Amplify environment name (required, 2-10 lowercase letters) */
  envName: string;
  profile: string;
}

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
  envName: string;
  profile: string;
}

export class AmplifyInitializer {
  constructor(private readonly logger: Logger) {}

  async initializeApp(options: InitializeAppOptions): Promise<void> {
    const { appPath, config, deploymentName, envName, profile } = options;

    this.logger.info(`Starting amplify init for ${deploymentName} (config: ${config.app.name})`);
    this.logger.debug(`App path: ${appPath}`);
    this.logger.debug(`Configuration: ${JSON.stringify(config, null, 2)}`);
    this.logger.debug(`Deployment name: ${deploymentName}`);

    const appNameValidation = this.validateAppName(deploymentName);
    if (!appNameValidation.valid) {
      throw Error(`Invalid app name: ${appNameValidation.error}`);
    }

    const amplifyEnvNameValidation = this.validateEnvName(envName);
    if (!amplifyEnvNameValidation.valid) {
      throw Error(`Invalid env name: ${amplifyEnvNameValidation.error}`);
    }

    const startTime = Date.now();
    try {
      this.logger.debug(`Calling initJSProjectWithProfile...`);
      const settings = this.buildInitSettings({ config, deploymentName, profile, envName });
      this.logger.debug(`Init settings: ${JSON.stringify(settings, null, 2)}`);
      await initJSProjectWithProfile(appPath, settings);

      const duration = Date.now() - startTime;
      this.logger.info(`Successfully initialized Amplify app in ${appPath} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`Failed to initialize Amplify app: ${deploymentName} (failed after ${duration}ms)`, error as Error);
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

  /** Generates a random env name (2-10 lowercase letters) */
  static generateRandomEnvName(): string {
    const length = Math.floor(Math.random() * 9) + 2;
    return Array.from({ length }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
  }

  private buildInitSettings(options: BuildInitSettingsOptions): Partial<AmplifyInitSettings> {
    const { config, deploymentName, profile, envName } = options;

    const settings = {
      name: deploymentName,
      envName,
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
    this.logger.debug(`Built init settings for ${deploymentName} (config: ${config.app.name}):`);
    this.logger.debug(`- Name: ${settings.name}`);
    this.logger.info(`Using Amplify environment name: ${settings.envName}`);
    this.logger.debug(`- Using default selections for editor, framework, etc.`);

    return settings;
  }
}
