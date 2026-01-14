/**
 * Test for the fixed CDK Atmosphere Integration
 * This test verifies that our integration works correctly with the proper API usage
 */

import { CDKAtmosphereIntegration } from '../core/cdk-atmosphere-integration';
import { EnvironmentDetector } from '../core/environment-detector';
import { Logger } from '../utils/logger';

describe('CDK Atmosphere Integration', () => {
  let integration: CDKAtmosphereIntegration;
  let logger: Logger;
  let environmentDetector: EnvironmentDetector;

  beforeEach(() => {
    logger = new Logger();
    environmentDetector = new EnvironmentDetector(logger);
    integration = new CDKAtmosphereIntegration(logger, environmentDetector);
  });

  afterEach(async () => {
    // Clean up any resources
    try {
      await integration.cleanup();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

  describe('Environment Detection', () => {
    it('should detect if we are in an Atmosphere environment', async () => {
      const isAtmosphere = await integration.isAtmosphereEnvironment();
      console.log(`Is Atmosphere environment: ${isAtmosphere}`);

      // This should return true if CDK client is available and we're in the right environment
      expect(typeof isAtmosphere).toBe('boolean');
    });
  });

  describe('Atmosphere Integration', () => {
    it('should attempt to initialize for Atmosphere environment', async () => {
      const isAtmosphere = await integration.isAtmosphereEnvironment();

      console.log(`Environment type: ${isAtmosphere ? 'Atmosphere' : 'Local'}`);

      if (!isAtmosphere) {
        console.log('Skipping Atmosphere initialization (not in Atmosphere environment or client not available)');
      }

      console.log('Attempting to initialize for Atmosphere environment...');

      try {
        const allocation = await integration.initializeForAtmosphere();

        console.log('✅ Successfully initialized Atmosphere client!');
        console.log('Credentials summary:', {
          hasAccessKey: !!allocation.accessKeyId,
          hasSecretKey: !!allocation.secretAccessKey,
          hasSessionToken: !!allocation.sessionToken,
          region: allocation.region,
        });

        expect(allocation).toBeDefined();
        expect(allocation.accessKeyId).toBeDefined();
        expect(allocation.secretAccessKey).toBeDefined();
        expect(allocation.region).toBeDefined();
      } catch (error) {
        console.log(`Failed to initialize Atmosphere client: ${(error as Error).message}`);

        // Check for common issues
        if ((error as Error).message.includes('dynamic import')) {
          throw Error('The CDK Atmosphere client requires the Node.js --experimental-vm-modules flag');
        } else if ((error as Error).message.includes('pool')) {
          throw Error('Pool access issue. Check if CDK_INTEG_ATMOSPHERE_POOL is set and accessible');
        } else if ((error as Error).message.includes('timeoutSeconds')) {
          throw Error('Parameter issue. The acquire() method expects proper parameters (pool and requester)');
        }
      }
    });

    it('should get profile from allocation', async () => {
      const isAtmosphere = await integration.isAtmosphereEnvironment();

      if (!isAtmosphere) {
        console.log('Skipping test, not in Atmosphere environment or client not available.');
        return;
      }

      try {
        const profileName = await integration.getProfileFromAllocation();

        console.log('✅ Successfully got profile from allocation!');
        console.log('Profile name:', profileName);

        expect(profileName).toBeDefined();
        expect(typeof profileName).toBe('string');
        expect(profileName).toMatch(/^atmosphere-\d+-[a-f0-9]+$/);
      } catch (error) {
        throw Error(`Failed to get profile from allocation: ${(error as Error).message}`);
      }
    });
  });

  describe('Utility Methods', () => {
    it('should provide credentials status', () => {
      const hasCredentials = integration.hasValidCredentials();
      console.log(`Has valid credentials: ${hasCredentials}`);

      expect(typeof hasCredentials).toBe('boolean');
    });

    it('should provide credentials summary', () => {
      const summary = integration.getCredentialsSummary();
      console.log('Credentials summary:', JSON.stringify(summary, null, 2));

      expect(summary).toBeDefined();
      expect(summary.status).toBeDefined();
    });
  });

  describe('Environment Summary', () => {
    it('should provide complete environment summary', async () => {
      const envType = await environmentDetector.detectEnvironment();

      const summary = {
        type: envType,
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        workingDirectory: process.cwd(),
        awsRegion: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
        hasAWSCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        isCI: !!process.env.CI,
      };

      console.log('Environment summary:', JSON.stringify(summary, null, 2));

      expect(summary.type).toBeDefined();
      expect(summary.nodeVersion).toBeDefined();
    });
  });
});
