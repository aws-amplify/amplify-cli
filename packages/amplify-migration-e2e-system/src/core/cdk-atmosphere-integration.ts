/**
 * CDK Atmosphere Client Integration
 * Handles detection and integration with Atmosphere environments while supporting local AWS configurations
 */

import { ICDKAtmosphereIntegration, ILogger, IEnvironmentDetector, IAWSProfileManager } from '../interfaces';
import { EnvironmentType, LogContext, AtmosphereAllocation } from '../types';
import { AtmosphereClient } from '@cdklabs/cdk-atmosphere-client';
import { AWSProfileManager } from '../utils/aws-profile-manager';
import * as crypto from 'crypto';

// Amplify supported regions (copied from @aws-amplify/amplify-e2e-core to avoid ESM import issues)
const amplifyRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-north-1',
  'eu-south-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-central-1',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-northeast-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-south-1',
  'ca-central-1',
  'me-south-1',
  'sa-east-1',
];

// Maximum number of allocation attempts to get a supported Amplify region
const MAX_ALLOCATION_ATTEMPTS = 10;

export class CDKAtmosphereIntegration implements ICDKAtmosphereIntegration {
  private atmosphereClient?: AtmosphereClient;
  private cachedAllocation?: AtmosphereAllocation;
  private allocationId?: string;
  private currentProfileName?: string;
  private readonly profileManager: IAWSProfileManager;
  private readonly supportedRegions: Set<string>;

  constructor(private readonly logger: ILogger, private readonly environmentDetector: IEnvironmentDetector, homeDir?: string) {
    this.profileManager = new AWSProfileManager(logger, homeDir);
    this.supportedRegions = new Set(amplifyRegions);
  }

  /**
   * Checks if a region is supported by Amplify
   */
  isRegionSupported(region: string): boolean {
    return this.supportedRegions.has(region);
  }

  /**
   * Generates a unique profile name with format `atmosphere-{timestamp}-{random}`
   * The timestamp ensures chronological ordering and the random suffix prevents collisions
   */
  generateProfileName(): string {
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(3).toString('hex'); // 6 hex characters
    return `atmosphere-${timestamp}-${randomSuffix}`;
  }

  async isAtmosphereEnvironment(): Promise<boolean> {
    const context: LogContext = { operation: 'isAtmosphereEnvironment' };

    try {
      const envType = await this.environmentDetector.detectEnvironment();
      const isAtmosphere = envType === EnvironmentType.ATMOSPHERE;

      this.logger.debug(`Environment type detected: ${envType}`, context);
      return isAtmosphere;
    } catch (error) {
      this.logger.error('Failed to detect environment type', error as Error, context);
      return false;
    }
  }

  async initializeForAtmosphere(): Promise<AtmosphereAllocation> {
    const context: LogContext = { operation: 'initializeForAtmosphere' };
    this.logger.info('Initializing CDK Atmosphere client for Atmosphere environment', context);

    if (this.cachedAllocation) {
      this.logger.debug('Using cached Atmosphere credentials', context);
      return this.cachedAllocation;
    }

    // try {
    const atmosphereEndpoint = process.env.ATMOSPHERE_ENDPOINT;
    if (!atmosphereEndpoint) {
      throw Error('ATMOSPHERE_ENDPOINT must be configured as an env variable.');
    }
    this.atmosphereClient = new AtmosphereClient(atmosphereEndpoint, {
      // Optional: change logStream if needed for debugging
      logStream: process.stdout,
    });

    this.logger.debug(`Initialized Atmosphere client with endpoint: ${atmosphereEndpoint}`, context);

    // Get allocation from Atmosphere
    const allocation = await this.getAtmosphereAllocation();

    this.cachedAllocation = allocation;

    this.logger.info('Successfully initialized CDK Atmosphere client', context);
    return allocation;
  }

  /**
   * Gets credentials from Atmosphere and writes them to AWS profile files.
   * Returns the generated profile name that can be used with AWS CLI/SDK.
   */
  async getProfileFromAllocation(): Promise<string> {
    const context: LogContext = { operation: 'getProfileFromAllocation' };

    const isAtmosphere = await this.isAtmosphereEnvironment();

    if (!isAtmosphere) {
      throw Error('Must use Atmosphere for this method');
    }

    try {
      const allocation = await this.initializeForAtmosphere();

      // Generate a unique profile name
      const profileName = this.generateProfileName();
      this.currentProfileName = profileName;

      // Write credentials to AWS profile files
      await this.profileManager.writeProfile(profileName, {
        credentials: {
          accessKeyId: allocation.accessKeyId,
          secretAccessKey: allocation.secretAccessKey,
          sessionToken: allocation.sessionToken,
        },
        region: allocation.region,
      });

      this.logger.info(`Created AWS profile: ${profileName}`, context);
      return profileName;
    } catch (atmosphereError) {
      throw Error(`Atmosphere credentials failed: ${(atmosphereError as Error).message}`);
    }
  }

  async cleanup(): Promise<void> {
    const context: LogContext = { operation: 'cleanup' };
    const isAtmosphere = await this.isAtmosphereEnvironment();

    if (!isAtmosphere) {
      this.logger.debug('Not in Atmosphere environment, skipping Atmosphere cleanup.');
      return;
    }

    this.logger.debug('Cleaning up CDK Atmosphere client', context);

    try {
      // Remove the AWS profile if we created one
      if (this.currentProfileName) {
        this.logger.debug(`Removing AWS profile: ${this.currentProfileName}`, context);
        try {
          await this.profileManager.removeProfile(this.currentProfileName);
          this.logger.debug(`Successfully removed AWS profile: ${this.currentProfileName}`, context);
        } catch (profileError) {
          // Log warning but continue with cleanup - profile may not exist
          this.logger.warn(`Failed to remove AWS profile ${this.currentProfileName}: ${(profileError as Error).message}`);
        }
        this.currentProfileName = undefined;
      }

      // Release the Atmosphere allocation if we have one
      if (this.atmosphereClient && this.allocationId) {
        this.logger.debug(`Releasing Atmosphere allocation: ${this.allocationId}`, context);
        await this.atmosphereClient.release(this.allocationId, 'success');
        this.allocationId = undefined;
      }

      // Clean up client reference
      this.atmosphereClient = undefined;
      this.cachedAllocation = undefined;

      this.logger.debug('Successfully cleaned up CDK Atmosphere client', context);
    } catch (error) {
      this.logger.error('Failed to cleanup CDK Atmosphere client', error as Error, context);
      throw error;
    }
  }

  private async getAtmosphereAllocation(): Promise<AtmosphereAllocation> {
    const context: LogContext = { operation: 'getAtmosphereCredentials' };

    if (!this.atmosphereClient) {
      throw Error('Atmosphere client not initialized');
    }

    if (!process.env.DEFAULT_POOL) {
      throw Error('DEFAULT_POOL must be present in env vars');
    }

    const poolName = process.env.DEFAULT_POOL;
    const requesterName = process.env.USER || process.env.USERNAME || 'amplify-migration-e2e-system';

    // Retry loop to get an allocation in a supported Amplify region
    for (let attempt = 1; attempt <= MAX_ALLOCATION_ATTEMPTS; attempt++) {
      try {
        this.logger.debug(
          `Attempt ${attempt}/${MAX_ALLOCATION_ATTEMPTS}: Acquiring environment allocation from pool: ${poolName}`,
          context,
        );

        const allocation = await this.atmosphereClient.acquire({
          pool: poolName,
          requester: requesterName,
          timeoutSeconds: 60 * 30, // 30 minutes timeout
        });

        if (!allocation) {
          throw new Error('No allocation returned from Atmosphere');
        }

        if (!allocation.credentials) {
          throw new Error('No credentials found in Atmosphere allocation');
        }

        if (!allocation.environment) {
          throw new Error('No environment found in Atmosphere allocation');
        }

        const { credentials, environment } = allocation;

        if (!credentials.accessKeyId || !credentials.secretAccessKey) {
          throw new Error('Invalid credentials format from Atmosphere allocation');
        }

        // Check if the region is supported by Amplify
        if (!this.isRegionSupported(environment.region)) {
          this.logger.warn(
            `Allocation ${allocation.id} is in unsupported region ${environment.region}. Releasing and retrying...`,
            context,
          );

          // Release this allocation and try again
          await this.atmosphereClient.release(allocation.id, 'success');
          continue;
        }

        // Store the allocation ID for later release
        this.allocationId = allocation.id;

        const atmosphereAllocation: AtmosphereAllocation = {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          sessionToken: credentials.sessionToken || '',
          region: environment.region,
        };

        this.logger.info(
          `Successfully acquired allocation ${allocation.id} in supported region ${environment.region} (attempt ${attempt})`,
          context,
        );
        this.logger.debug(`Account: ${environment.account}, Region: ${environment.region}`, context);

        return atmosphereAllocation;
      } catch (error) {
        // If this is the last attempt, throw the error
        if (attempt === MAX_ALLOCATION_ATTEMPTS) {
          this.logger.error(
            `Failed to get Atmosphere allocation in supported region after ${MAX_ALLOCATION_ATTEMPTS} attempts`,
            error as Error,
            context,
          );
          throw error;
        }

        // Log and continue to next attempt
        this.logger.warn(`Attempt ${attempt} failed: ${(error as Error).message}. Retrying...`, context);
      }
    }

    throw new Error(`Failed to acquire Atmosphere allocation in a supported Amplify region after ${MAX_ALLOCATION_ATTEMPTS} attempts`);
  }

  // Utility methods for testing and debugging
  hasValidCredentials(): boolean {
    return !!this.cachedAllocation && !!this.cachedAllocation.accessKeyId && !!this.cachedAllocation.secretAccessKey;
  }

  getCredentialsSummary(): Record<string, unknown> {
    if (!this.cachedAllocation) {
      return { status: 'no-credentials' };
    }

    return {
      status: 'credentials-available',
      region: this.cachedAllocation.region,
      hasAccessKey: !!this.cachedAllocation.accessKeyId,
      hasSecretKey: !!this.cachedAllocation.secretAccessKey,
      hasSessionToken: !!this.cachedAllocation.sessionToken,
    };
  }
}
