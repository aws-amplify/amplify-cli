/**
 * Environment detection for Atmosphere vs Local environments
 */

import { EnvironmentType } from '../types';
import { Logger } from '../utils/logger';

export class EnvironmentDetector implements EnvironmentDetector {
  private detectedEnvironment?: EnvironmentType;
  private environmentVariables: Record<string, string>;

  constructor(private readonly logger: Logger) {
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
    // Check for Atmosphere environment variables
    const atmosphereEnvVars = ['ATMOSPHERE_ENDPOINT', 'DEFAULT_POOL'];

    const hasAllAtmosphereVars = atmosphereEnvVars.every((indicator) => this.environmentVariables[indicator]);

    if (hasAllAtmosphereVars) {
      this.logger.debug('Atmosphere environment detected via environment variables');
      return true;
    }

    this.logger.debug('No Atmosphere environment indicators found, assuming local environment');
    return false;
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
}
