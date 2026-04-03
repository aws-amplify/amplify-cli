/**
 * Amplify Initializer for executing amplify init programmatically
 * Uses the e2e-core utilities for reliable amplify init execution
 */

import { initJSProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import { Logger } from '../utils/logger';
import path from 'path';
import * as fs from 'fs-extra';

export interface InitializeAppOptions {
  appPath: string;
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
  sourceAppPath: string;
  deploymentName: string;
  envName: string;
  profile: string;
}

export class AmplifyInitializer {
  constructor(private readonly logger: Logger) {}

  async initializeApp(options: InitializeAppOptions): Promise<void> {
    const { appPath, deploymentName, envName, profile } = options;

    this.logger.info(`Starting amplify init for ${deploymentName}`);
    this.logger.debug(`App path: ${appPath}`);
    this.logger.debug(`Deployment name: ${deploymentName}`);

    const startTime = Date.now();
    try {
      this.logger.debug(`Calling initJSProjectWithProfile...`);
      const settings = this.buildInitSettings({ sourceAppPath: appPath, deploymentName, profile, envName });
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

  /** Generates a random env name (2-10 lowercase letters) */
  static generateRandomEnvName(): string {
    const length = Math.floor(Math.random() * 9) + 2;
    return Array.from({ length }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join('');
  }

  private buildInitSettings(options: BuildInitSettingsOptions): Partial<AmplifyInitSettings> {
    const mainTsx = path.join(options.sourceAppPath, 'src', 'main.tsx');
    const framework = fs.existsSync(mainTsx) ? 'react' : 'none';
    const settings = {
      name: options.deploymentName,
      envName: options.envName,
      editor: 'Visual Studio Code',
      framework: framework,
      srcDir: 'src',
      distDir: 'dist',
      buildCmd: 'npm run build',
      startCmd: 'npm run start',
      disableAmplifyAppCreation: false, // always create app in Amplify console
      profileName: options.profile,
    };

    this.logger.debug(`Built init settings for ${options.deploymentName}: ${JSON.stringify(settings, null, 2)}`);

    return settings;
  }
}
