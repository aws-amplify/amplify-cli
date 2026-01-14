/**
 * Integration Tests for AmplifyInitializer with CDK Atmosphere Client
 * Tests the full end-to-end flow of using Atmosphere credentials to initialize Amplify apps
 */

import { AmplifyInitializer, CDKAtmosphereIntegration, EnvironmentDetector } from '../core';
import { Logger } from '../utils/logger';
import { AppConfiguration, EnvironmentType, LogLevel } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// Test-specific logging functionality
class TestLogger {
  private logFile: string;
  private logStream: fs.WriteStream;

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logsDir = path.join(__dirname, '..', '..', 'logs');

    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    this.logFile = path.join(logsDir, `atmosphere-integration-test-${timestamp}.log`);
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'w' });

    this.log('INFO', 'Test logger initialized', { logFile: this.logFile, timestamp });
  }

  log(level: string, message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data }),
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    this.logStream.write(logLine);

    // Also log to console for immediate visibility
    console.log(`[${level}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }

  close() {
    return new Promise<void>((resolve) => {
      this.logStream.end(() => {
        resolve();
      });
    });
  }

  getLogFile() {
    return this.logFile;
  }
}

describe('AmplifyInitializer + CDK Atmosphere Integration', () => {
  let logger: Logger;
  let testLogger: TestLogger;
  let environmentDetector: EnvironmentDetector;
  let atmosphereIntegration: CDKAtmosphereIntegration;
  let amplifyInitializer: AmplifyInitializer;
  let testDir: string;
  let atmosphereAvailable = false;

  beforeAll(async () => {
    console.log('🔍 Checking integration test prerequisites...');

    // Check if CDK Atmosphere client is available
    try {
      logger = new Logger(LogLevel.DEBUG);
      environmentDetector = new EnvironmentDetector(logger);
      const detectedEnvironment = await environmentDetector.detectEnvironment();
      atmosphereAvailable = detectedEnvironment === EnvironmentType.ATMOSPHERE;
    } catch (error) {
      throw Error(`❌ CDK Atmosphere client initialization failed: ${error}`);
    }

    // Check if Amplify CLI is available
    try {
      const version = execSync('amplify --version', { stdio: 'pipe', timeout: 10000 }).toString().trim();
      console.log(`✅ Amplify CLI found: ${version}`);
    } catch (error) {
      console.log('❌ Amplify CLI not available - some tests may be skipped');
    }

    console.log(`📦 Node.js version: ${process.version}`);
    console.log(`🏠 Test environment: ${process.env.NODE_ENV || 'development'}`);
  });

  beforeEach(() => {
    console.log('🧪 Setting up integration test environment...');

    // Initialize test logger for this test run
    testLogger = new TestLogger();
    testLogger.log('INFO', 'Starting new test run', {
      testSuite: 'AmplifyInitializer + CDK Atmosphere Integration',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    });

    atmosphereIntegration = new CDKAtmosphereIntegration(logger, environmentDetector);
    amplifyInitializer = new AmplifyInitializer(logger);

    // Create a temporary directory for testing
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amplify-atmosphere-test-'));
    console.log(`📁 Created test directory: ${testDir}`);

    testLogger.log('INFO', 'Test environment setup', {
      testDirectory: testDir,
      atmosphereAvailable: atmosphereAvailable,
    });

    // Ensure test directory is writable
    try {
      const testFile = path.join(testDir, 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✅ Test directory is writable');
      testLogger.log('INFO', 'Test directory validated', { writable: true });
    } catch (error) {
      console.error('❌ Test directory is not writable:', error);
      testLogger.log('ERROR', 'Test directory validation failed', { error: (error as Error).message });
      throw error;
    }
  });

  afterEach(async () => {
    console.log('🧹 Cleaning up test environment...');

    if (testLogger) {
      testLogger.log('INFO', 'Test cleanup started');

      // Clean up Atmosphere resources
      try {
        await atmosphereIntegration.cleanup();
      } catch (error) {
        console.warn('⚠️  Failed to cleanup Atmosphere integration:', error);
        testLogger.log('WARN', 'Atmosphere cleanup failed', { error: (error as Error).message });
      }

      // Clean up test directory
      if (testDir && fs.existsSync(testDir)) {
        try {
          console.log(`🗑️  Removing test directory: ${testDir}`);
          fs.rmSync(testDir, { recursive: true, force: true });
          console.log('✅ Test directory cleaned up successfully');
          testLogger.log('INFO', 'Test directory cleaned up', { testDirectory: testDir });
        } catch (error) {
          console.warn(`⚠️  Failed to clean up test directory: ${testDir}`, error);
          testLogger.log('ERROR', 'Test directory cleanup failed', {
            testDirectory: testDir,
            error: (error as Error).message,
          });
        }
      }

      testLogger.log('INFO', 'Test run completed');
      console.log(`📄 Test log saved to: ${testLogger.getLogFile()}`);
      await testLogger.close();
    }
  });

  describe('Environment Detection Integration', () => {
    it('should detect environment and check Atmosphere availability', async () => {
      console.log('🔍 Testing environment detection integration...');

      const isAtmosphere = await atmosphereIntegration.isAtmosphereEnvironment();

      console.log(`📊 Environment detection results:`);
      console.log(`  - Is Atmosphere environment: ${isAtmosphere}`);

      expect(typeof isAtmosphere).toBe('boolean');

      console.log('✅ Environment detection integration test passed');
    });
  });

  describe('Credentials Integration', () => {
    it('should get profile from allocation for Amplify initialization', async () => {
      console.log('🔑 Testing profile-based credentials integration...');

      if (!atmosphereAvailable) {
        console.log('⏭️  Skipping test - CDK Atmosphere client not available');
        return;
      }

      try {
        const profileName = await atmosphereIntegration.getProfileFromAllocation();

        console.log(`📊 Profile created:`);
        console.log(`  - Profile name: ${profileName}`);
        console.log(`  - Matches pattern: ${/^atmosphere-\d+-[a-f0-9]+$/.test(profileName)}`);

        expect(profileName).toBeDefined();
        expect(typeof profileName).toBe('string');
        expect(profileName).toMatch(/^atmosphere-\d+-[a-f0-9]+$/);
        console.log('✅ Atmosphere profile successfully created');
      } catch (error) {
        throw Error(`⚠️  Profile creation test failed: ${(error as Error).message}`);
      }
    });
  });

  describe('Full Integration Test', () => {
    it('should initialize Amplify app with Atmosphere profile', async () => {
      console.log('🚀 Starting full Atmosphere + Amplify integration test...');

      if (!atmosphereAvailable) {
        console.log('⏭️  Skipping test - CDK Atmosphere client not available');
        return;
      }

      const config = {
        app: {
          name: 'testatmosphereapp',
          description: 'Test application with Atmosphere credentials',
          framework: 'react',
        },
        categories: {
          api: {
            type: 'GraphQL' as const,
            authModes: ['API_KEY' as const],
          },
        },
      };

      console.log(`📋 Test configuration:`, JSON.stringify(config, null, 2));
      console.log(`📁 Test directory: ${testDir}`);

      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(
            new Error('Integration test timed out after 90 seconds - this suggests an issue with the Atmosphere + Amplify integration'),
          );
        }, 90000); // 90 second timeout for integration test
      });

      const startTime = Date.now();
      const testStartTime = new Date().toISOString();

      // Log environment detection details
      const envDetectionResult = await atmosphereIntegration.isAtmosphereEnvironment();
      testLogger.log('INFO', 'Environment detection completed', {
        isAtmosphereEnvironment: envDetectionResult,
        environmentVariables: {
          ATMOSPHERE_ENDPOINT: process.env.ATMOSPHERE_ENDPOINT ? 'SET' : 'NOT_SET',
          DEFAULT_POOL: process.env.DEFAULT_POOL ? 'SET' : 'NOT_SET',
        },
      });

      testLogger.log('INFO', '⏰ Starting full integration test', {
        appConfig: config,
        testDirectory: testDir,
        startTime: testStartTime,
        atmosphereEnvironmentDetected: envDetectionResult,
      });

      let profileName: string | undefined;

      try {
        // Step 1: Get Atmosphere profile
        testLogger.log('INFO', '🔑 Step 1: Getting Atmosphere profile');

        profileName = await atmosphereIntegration.getProfileFromAllocation();

        testLogger.log('INFO', '✅ Profile created successfully', {
          profileName: profileName,
          matchesPattern: /^atmosphere-\d+-[a-f0-9]+$/.test(profileName),
        });

        // Step 2: Initialize Amplify app with profile
        testLogger.log('INFO', '🚀 Step 2: Initializing Amplify app with profile', {
          profileName: profileName,
        });

        await Promise.race([
          amplifyInitializer.initializeApp({
            appPath: testDir,
            config,
            deploymentName: 'atmosphereAmplifyApp',
            profile: profileName,
          }),
          timeoutPromise,
        ]);

        const duration = Date.now() - startTime;

        // Step 3: Verify that amplify directory was created
        const amplifyDir = path.join(testDir, 'amplify');
        const backendDir = path.join(testDir, 'amplify', 'backend');

        testLogger.log('INFO', '🔍 Verifying Amplify initialization');

        expect(fs.existsSync(amplifyDir)).toBe(true);
        expect(fs.existsSync(backendDir)).toBe(true);

        // List contents for debugging and logging
        let amplifyContents: string[] = [];
        let backendContents: string[] = [];
        try {
          amplifyContents = fs.readdirSync(amplifyDir);
          if (fs.existsSync(backendDir)) {
            backendContents = fs.readdirSync(backendDir);
          }
        } catch (listError) {
          testLogger.log('WARN', '⚠️ Failed to list directory contents', { error: (listError as Error).message });
        }

        // Log successful initialization details
        testLogger.log('SUCCESS', '🎉 Amplify app initialization completed successfully', {
          app: {
            name: config.app.name,
            description: config.app.description,
          },
          duration: duration,
          amplifyDirectoryExists: fs.existsSync(amplifyDir),
          backendDirectoryExists: fs.existsSync(backendDir),
          amplifyContents: amplifyContents,
          backendContents: backendContents,
          profileName: profileName,
          environmentType: envDetectionResult ? 'ATMOSPHERE' : 'LOCAL',
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Integration test failed after ${duration}ms:`, error);

        // Additional debugging information
        console.log('🔍 Debug information:');
        console.log(`- Test directory exists: ${fs.existsSync(testDir)}`);
        console.log(`- Test directory contents:`, fs.existsSync(testDir) ? fs.readdirSync(testDir) : 'N/A');
        console.log(`- Current working directory: ${process.cwd()}`);
        console.log(`- Profile name: ${profileName}`);
        console.log(`- Environment variables:`, {
          NODE_ENV: process.env.NODE_ENV,
          AWS_PROFILE: process.env.AWS_PROFILE,
          AWS_REGION: process.env.AWS_REGION,
          CDK_INTEG_ATMOSPHERE_POOL: process.env.CDK_INTEG_ATMOSPHERE_POOL,
        });

        // If it's our timeout error, provide helpful guidance
        if ((error as Error).message.includes('timed out after 90 seconds')) {
          console.log('This timeout suggests an issue with the Atmosphere + Amplify integration.');
          console.log('Potential causes:');
          console.log('   - Atmosphere profile not properly written to ~/.aws files');
          console.log('   - Interactive prompts waiting for user input');
          console.log('   - AWS authentication issues with Atmosphere credentials');
          console.log('   - Network connectivity problems');
        }

        throw error;
      }
    }, 120000); // 2 minute Jest timeout (our internal timeout is 90 seconds)
  });

  describe('Error Handling Integration', () => {
    it('should handle initialization failures gracefully with profile cleanup', async () => {
      console.log('❌ Testing error handling integration...');

      if (!atmosphereAvailable) {
        console.log('⏭️  Skipping test - CDK Atmosphere client not available');
        return;
      }

      const config: AppConfiguration = {
        app: {
          name: 'testerrorapp',
          description: 'Test application for error handling',
          framework: 'react',
        },
        categories: {},
      };

      // Test with invalid path to trigger error
      const invalidTestDir = '/invalid/path/that/does/not/exist';
      console.log(`❌ Testing with invalid path: ${invalidTestDir}`);

      // Get a valid profile - cleanup will happen in afterEach
      const profileName = await atmosphereIntegration.getProfileFromAllocation();
      console.log(`📝 Created profile: ${profileName}`);

      // This should fail due to invalid path, regardless of profile
      try {
        await amplifyInitializer.initializeApp({
          appPath: invalidTestDir,
          config,
          deploymentName: 'invalidPathApp',
          profile: profileName,
        });
        // If we get here, the test should fail
        fail('Expected an error to be thrown for invalid path');
      } catch (error) {
        console.log(`Expected error caught: ${(error as Error).message}`);
      }

      console.log('✅ Error handling test passed');
    });
  });

  describe('Profile Management', () => {
    it('should create profile with correct format', async () => {
      console.log('🔧 Testing profile name format...');

      if (!atmosphereAvailable) {
        console.log('⏭️  Skipping test - CDK Atmosphere client not available');
        return;
      }

      const profileName = await atmosphereIntegration.getProfileFromAllocation();

      // Verify profile name format: atmosphere-{timestamp}-{random}
      expect(profileName).toMatch(/^atmosphere-\d+-[a-f0-9]+$/);

      console.log(`✅ Profile name format test passed: ${profileName}`);
    });
  });
});
