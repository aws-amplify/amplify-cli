/**
 * Environment detection for Atmosphere vs Local environments
 */

import { IEnvironmentDetector, ILogger } from '../interfaces';
import { EnvironmentType } from '../types';

export class EnvironmentDetector implements IEnvironmentDetector {
  private detectedEnvironment?: EnvironmentType;
  private environmentVariables: Record<string, string>;

  constructor(private readonly logger: ILogger) {
    this.environmentVariables = Object.fromEntries(Object.entries(process.env).filter(([, value]) => value !== undefined)) as Record<
      string,
      string
    >;
  }

  async detectEnvironment(): Promise<EnvironmentType> {
    if (this.detectedEnvironment) {
      return this.detectedEnvironment;
    }

    this.logger.debug('Detecting execution environment');

    const isAtmosphere = await this.isAtmosphereEnvironment();
    this.detectedEnvironment = isAtmosphere ? EnvironmentType.ATMOSPHERE : EnvironmentType.LOCAL;

    this.logger.info(`Detected environment: ${this.detectedEnvironment}`);
    return this.detectedEnvironment;
  }

  async isAtmosphereEnvironment(): Promise<boolean> {
    // Check for Atmosphere-specific environment variables
    const atmosphereIndicators = ['ATMOSPHERE_ENVIRONMENT', 'ATMOSPHERE_WORKSPACE', 'ATMOSPHERE_REGION', 'CDK_ATMOSPHERE_CLIENT_AVAILABLE'];

    const hasAtmosphereVars = atmosphereIndicators.some((indicator) => this.environmentVariables[indicator]);

    if (hasAtmosphereVars) {
      this.logger.debug('Atmosphere environment detected via environment variables');
      return true;
    }

    // Check for CDK Atmosphere client availability
    const hasCDKClient = await this.checkCDKAtmosphereClientAvailability();
    if (hasCDKClient) {
      this.logger.debug('Atmosphere environment detected via CDK client availability');
      return true;
    }

    // Check for Atmosphere-specific file system indicators
    const hasAtmosphereFS = await this.checkAtmosphereFileSystem();
    if (hasAtmosphereFS) {
      this.logger.debug('Atmosphere environment detected via file system indicators');
      return true;
    }

    // Check for Atmosphere-specific network indicators
    const hasAtmosphereNetwork = await this.checkAtmosphereNetwork();
    if (hasAtmosphereNetwork) {
      this.logger.debug('Atmosphere environment detected via network indicators');
      return true;
    }

    this.logger.debug('No Atmosphere environment indicators found, assuming local environment');
    return false;
  }

  getEnvironmentVariables(): Record<string, string> {
    return { ...this.environmentVariables };
  }

  getEnvironmentVariable(name: string): string | undefined {
    return this.environmentVariables[name];
  }

  hasEnvironmentVariable(name: string): boolean {
    return name in this.environmentVariables;
  }

  getAWSRegion(): string | undefined {
    // Check various sources for AWS region
    return (
      this.environmentVariables.AWS_REGION ||
      this.environmentVariables.AWS_DEFAULT_REGION ||
      this.environmentVariables.ATMOSPHERE_REGION ||
      'us-east-1' // Default fallback
    );
  }

  getAWSProfile(): string | undefined {
    return this.environmentVariables.AWS_PROFILE;
  }

  hasAWSCredentials(): boolean {
    // Check for access key credentials
    const hasAccessKeys = !!(this.environmentVariables.AWS_ACCESS_KEY_ID && this.environmentVariables.AWS_SECRET_ACCESS_KEY);

    // Check for profile-based credentials
    const hasProfile = !!this.environmentVariables.AWS_PROFILE;

    // Check for Atmosphere credentials
    const hasAtmosphereCredentials = !!(
      this.environmentVariables.ATMOSPHERE_ACCESS_KEY_ID || this.environmentVariables.ATMOSPHERE_SECRET_ACCESS_KEY
    );

    return hasAccessKeys || hasProfile || hasAtmosphereCredentials;
  }

  private async checkCDKAtmosphereClientAvailability(): Promise<boolean> {
    try {
      // Try to require the CDK Atmosphere client
      require('@cdklabs/cdk-atmosphere-client');
      this.logger.debug('CDK Atmosphere client is available');
      return true;
    } catch (error) {
      this.logger.debug('CDK Atmosphere client is not available');
      return false;
    }
  }

  private async checkAtmosphereFileSystem(): Promise<boolean> {
    const fs = require('fs-extra');

    // Check for Atmosphere-specific directories or files
    const atmospherePaths = ['/opt/atmosphere', '/atmosphere', '/.atmosphere', '/workspace/.atmosphere'];

    for (const atmospherePath of atmospherePaths) {
      try {
        if (await fs.pathExists(atmospherePath)) {
          this.logger.debug(`Found Atmosphere file system indicator: ${atmospherePath}`);
          return true;
        }
      } catch (error) {
        // Ignore errors when checking paths
      }
    }

    return false;
  }

  private async checkAtmosphereNetwork(): Promise<boolean> {
    // Check for Atmosphere-specific network indicators
    // This could include checking for specific hostnames, IP ranges, etc.

    const atmosphereHosts = ['atmosphere.aws.dev', 'atmosphere.amazon.com', 'cdk-atmosphere.aws.dev'];

    // For now, we'll just check if these hostnames are referenced in environment
    const hasAtmosphereHosts = atmosphereHosts.some((host) =>
      Object.values(this.environmentVariables).some((value) => typeof value === 'string' && value.includes(host)),
    );

    if (hasAtmosphereHosts) {
      this.logger.debug('Found Atmosphere network indicators in environment variables');
      return true;
    }

    return false;
  }

  getNodeVersion(): string {
    return process.version;
  }

  getPlatform(): string {
    return process.platform;
  }

  getArchitecture(): string {
    return process.arch;
  }

  getWorkingDirectory(): string {
    return process.cwd();
  }

  getHomeDirectory(): string {
    return require('os').homedir();
  }

  getTempDirectory(): string {
    return require('os').tmpdir();
  }

  isCI(): boolean {
    return !!(
      this.environmentVariables.CI ||
      this.environmentVariables.CONTINUOUS_INTEGRATION ||
      this.environmentVariables.BUILD_NUMBER ||
      this.environmentVariables.GITHUB_ACTIONS ||
      this.environmentVariables.TRAVIS ||
      this.environmentVariables.CIRCLECI ||
      this.environmentVariables.JENKINS_URL
    );
  }

  getEnvironmentSummary(): Record<string, unknown> {
    return {
      type: this.detectedEnvironment,
      nodeVersion: this.getNodeVersion(),
      platform: this.getPlatform(),
      architecture: this.getArchitecture(),
      workingDirectory: this.getWorkingDirectory(),
      awsRegion: this.getAWSRegion(),
      awsProfile: this.getAWSProfile(),
      hasAWSCredentials: this.hasAWSCredentials(),
      isCI: this.isCI(),
      cdkAtmosphereClientAvailable: this.checkCDKAtmosphereClientAvailability(),
    };
  }
}
