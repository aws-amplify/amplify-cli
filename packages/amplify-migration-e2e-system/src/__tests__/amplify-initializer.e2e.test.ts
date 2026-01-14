/**
 * E2E Tests for AmplifyInitializer
 * These tests require the Amplify CLI to be installed and available
 */

import { AmplifyInitializer } from '../core';
import { Logger } from '../utils/logger';
import { EnvironmentType, LogLevel } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

import { generateTimeBasedE2EAmplifyAppName } from '../utils/math';
import { EnvironmentDetector } from '../core/environment-detector';

const TEST_RUNNER_PROFILE = 'amplify1'; // this is the profile that will be read from your local system to deploy the Amplify App
const TEST_AMPLIFY_ENV_NAME = 'endtoend';

/**
 * Helper function to extract the Amplify App ID from the local project files
 */
function getAmplifyAppId(projectDir: string): string | null {
  try {
    // Try to get app ID from team-provider-info.json
    const teamProviderPath = path.join(projectDir, 'amplify', 'team-provider-info.json');
    if (fs.existsSync(teamProviderPath)) {
      const teamProviderInfo = JSON.parse(fs.readFileSync(teamProviderPath, 'utf-8'));
      // The structure is: { "envName": { "awscloudformation": { "AmplifyAppId": "..." } } }
      for (const envName of Object.keys(teamProviderInfo)) {
        const appId = teamProviderInfo[envName]?.awscloudformation?.AmplifyAppId;
        if (appId) {
          return appId;
        }
      }
    }

    // Fallback: try to get from local-env-info.json
    const localEnvPath = path.join(projectDir, 'amplify', '.config', 'local-env-info.json');
    if (fs.existsSync(localEnvPath)) {
      const localEnvInfo = JSON.parse(fs.readFileSync(localEnvPath, 'utf-8'));
      if (localEnvInfo.AmplifyAppId) {
        return localEnvInfo.AmplifyAppId;
      }
    }

    return null;
  } catch (error) {
    console.warn(`⚠️  Could not extract Amplify App ID: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Response type for delete-backend-environment AWS CLI command
 */
interface DeleteBackendEnvironmentResponse {
  backendEnvironment: {
    backendEnvironmentArn: string;
    environmentName: string;
    stackName?: string;
    deploymentArtifacts?: string;
    createTime: string;
    updateTime: string;
  };
}

/**
 * Helper function to delete an Amplify app using AWS CLI
 * First deletes the backend environment, then ensures the CloudFormation stack is deleted,
 * and finally deletes the app itself
 */
function deleteAmplifyApp(appId: string, profile: string = TEST_RUNNER_PROFILE, envName: string = TEST_AMPLIFY_ENV_NAME): boolean {
  try {
    // First, delete the backend environment
    console.log(`🗑️  Deleting backend environment: ${envName} for app: ${appId}`);
    let stackName: string | undefined;

    try {
      const deleteBackendEnvironmentOutputJson = execSync(
        `aws amplify delete-backend-environment --app-id ${appId} --environment-name ${envName} --profile ${profile} --output json`,
        {
          stdio: 'pipe',
          timeout: 60000,
        },
      ).toString();

      // Parse the response to get the stackName
      const backendEnvResponse = JSON.parse(deleteBackendEnvironmentOutputJson) as DeleteBackendEnvironmentResponse;
      stackName = backendEnvResponse.backendEnvironment.stackName;

      console.log(`✅ Successfully initiated backend environment deletion: ${envName}`);
      if (stackName) {
        console.log(`   CloudFormation stack: ${stackName}`);
      }
    } catch (envError) {
      throw new Error(`Failed to delete backend environment ${envName}: ${(envError as Error).message}`);
    }

    // If we have a stackName, ensure the CloudFormation stack is deleted
    if (stackName) {
      console.log(`🗑️  Deleting CloudFormation stack: ${stackName}`);
      try {
        // Delete the CloudFormation stack
        execSync(`aws cloudformation delete-stack --stack-name ${stackName} --profile ${profile}`, {
          stdio: 'pipe',
          timeout: 30000,
        });
        console.log(`⏳ Waiting for CloudFormation stack deletion to complete...`);

        // Wait for the stack deletion to complete (timeout after 10 minutes)
        execSync(`aws cloudformation wait stack-delete-complete --stack-name ${stackName} --profile ${profile}`, {
          stdio: 'pipe',
          timeout: 600000, // 10 minutes
        });
        console.log(`✅ CloudFormation stack ${stackName} deleted successfully`);
      } catch (stackError) {
        const errorMessage = (stackError as Error).message;
        throw new Error(
          `Failed to delete CloudFormation stack ${stackName}. ` +
            `This may leave orphaned resources in your AWS account. ` +
            `Please manually check and delete the stack if necessary. ` +
            `Error: ${errorMessage}`,
        );
      }
    }

    // Then delete the app
    console.log(`🗑️  Deleting Amplify app: ${appId} using profile: ${profile}`);
    execSync(`aws amplify delete-app --app-id ${appId} --profile ${profile}`, {
      stdio: 'pipe',
      timeout: 30000,
    });

    console.log(`✅ Successfully deleted Amplify app: ${appId}`);
    return true;
  } catch (error) {
    console.warn(`⚠️  Failed to delete Amplify app ${appId}: ${(error as Error).message}`);
    return false;
  }
}

/**
 * Helper function to wait for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('AmplifyInitializer E2E', () => {
  let logger: Logger;
  let amplifyInitializer: AmplifyInitializer;
  let testDir: string;
  let cliAvailable = false;
  let environmentDetector: EnvironmentDetector;
  let atmosphereAvailable = false;

  beforeAll(async () => {
    console.log('🔍 Checking Amplify CLI availability...');

    // Check if Amplify CLI is available
    try {
      const version = execSync('amplify --version', { stdio: 'pipe', timeout: 10000 }).toString().trim();
      console.log(`✅ Amplify CLI found: ${version}`);
      cliAvailable = true;
    } catch (error) {
      console.log('❌ Amplify CLI not available, E2E tests will be skipped');
      console.log(`Error: ${(error as Error).message}`);
      cliAvailable = false;
    }

    // Check AWS CLI availability
    try {
      const awsVersion = execSync('aws --version', { stdio: 'pipe', timeout: 5000 }).toString().trim();
      console.log(`✅ AWS CLI found: ${awsVersion}`);
    } catch (error) {
      console.log('⚠️  AWS CLI not available - this may cause authentication issues');
    }

    // Check Node.js version
    console.log(`📦 Node.js version: ${process.version}`);
    console.log(`🏠 Test environment: ${process.env.NODE_ENV || 'development'}`);

    // Check if CDK Atmosphere client is available
    try {
      logger = new Logger(LogLevel.DEBUG);
      environmentDetector = new EnvironmentDetector(logger);
      const detectedEnvironment = await environmentDetector.detectEnvironment();
      atmosphereAvailable = detectedEnvironment === EnvironmentType.ATMOSPHERE;
    } catch (error) {
      throw Error(`❌ CDK Atmosphere client initialization failed: ${error}`);
    }
  });

  beforeEach(() => {
    console.log('🧪 Setting up test environment...');

    logger = new Logger(LogLevel.DEBUG);
    amplifyInitializer = new AmplifyInitializer(logger);

    // Create a temporary directory for testing
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'amplify-init-test-'));
    console.log(`📁 Created test directory: ${testDir}`);

    // Ensure test directory is writable
    try {
      const testFile = path.join(testDir, 'test-write.tmp');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('✅ Test directory is writable');
    } catch (error) {
      console.error('❌ Test directory is not writable:', error);
      throw error;
    }
  });

  afterEach(() => {
    console.log('🧹 Cleaning up test environment...');

    // Clean up test directory
    if (testDir && fs.existsSync(testDir)) {
      try {
        console.log(`🗑️  Removing test directory: ${testDir}`);
        fs.rmSync(testDir, { recursive: true, force: true });
        console.log('✅ Test directory cleaned up successfully');
      } catch (error) {
        console.warn(`⚠️  Failed to clean up test directory: ${testDir}`, error);
      }
    }
  });

  describe('CLI availability', () => {
    it('should detect if Amplify CLI is available', () => {
      console.log('🔍 Testing CLI availability detection...');

      // Check if Amplify CLI is available
      let detectedCliAvailable = false;
      try {
        const version = execSync('amplify --version', { stdio: 'pipe', timeout: 10000 }).toString().trim();
        console.log(`✅ CLI version detected: ${version}`);
        detectedCliAvailable = true;
      } catch (error) {
        console.log(`❌ CLI not detected: ${(error as Error).message}`);
        detectedCliAvailable = false;
      }

      // This test just verifies we can check CLI availability
      expect(typeof detectedCliAvailable).toBe('boolean');
      console.log(`📊 CLI availability result: ${detectedCliAvailable}`);
    });
  });

  describe('initializeApp', () => {
    it('should successfully initialize an Amplify app using profile', async () => {
      if (atmosphereAvailable) {
        console.log('⏭️  Skipping test - CDK Atmosphere available, this test is only for profile');
        return;
      }

      console.log('🚀 Starting full Amplify initialization test...');

      // Check if we should skip this test (set SKIP_AMPLIFY_INIT=true to skip)
      if (process.env.SKIP_AMPLIFY_INIT === 'true') {
        console.log('⏭️  Skipping test - SKIP_AMPLIFY_INIT environment variable is set');
        return;
      }

      // Check if Amplify CLI is available
      if (!cliAvailable) {
        console.log('⏭️  Skipping test - Amplify CLI not available');
        return;
      }

      console.log('✅ Amplify CLI is available, proceeding with test');

      // Generate a unique alphanumeric app name (3-20 chars, alphanumeric only)
      const appName = generateTimeBasedE2EAmplifyAppName();
      const profile = TEST_RUNNER_PROFILE;

      const config = {
        app: {
          name: appName,
          description: 'E2E test application',
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
      console.log(`📝 App name: ${appName}`);

      // Add progress tracking
      const startTime = Date.now();
      console.log(`⏰ Starting amplify init at ${new Date().toISOString()}`);

      // Create a timeout promise to race against the actual init
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Amplify init timed out after 60 seconds - this suggests the initJSProjectWithProfile function is hanging'));
        }, 60000); // 60 second internal timeout
      });

      try {
        // Race the amplify init against our timeout
        await Promise.race([
          amplifyInitializer.initializeApp({ appPath: testDir, config, deploymentName: appName, profile, envName: TEST_AMPLIFY_ENV_NAME }),
          timeoutPromise,
        ]);

        const duration = Date.now() - startTime;
        console.log(`✅ Amplify init completed in ${duration}ms`);

        // Verify that amplify directory was created
        const amplifyDir = path.join(testDir, 'amplify');
        const backendDir = path.join(testDir, 'amplify', 'backend');

        console.log(`🔍 Checking for amplify directory: ${amplifyDir}`);
        expect(fs.existsSync(amplifyDir)).toBe(true);

        console.log(`🔍 Checking for backend directory: ${backendDir}`);
        expect(fs.existsSync(backendDir)).toBe(true);

        // List contents for debugging
        try {
          const amplifyContents = fs.readdirSync(amplifyDir);
          console.log(`📂 Amplify directory contents:`, amplifyContents);

          if (fs.existsSync(backendDir)) {
            const backendContents = fs.readdirSync(backendDir);
            console.log(`📂 Backend directory contents:`, backendContents);
          }
        } catch (listError) {
          console.warn('⚠️  Could not list directory contents:', listError);
        }

        console.log('🎉 All verification checks passed!');

        // Cleanup: Wait 20 seconds then delete the Amplify app from AWS
        console.log('⏳ Waiting 20 seconds before cleanup...');
        await sleep(20000);
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Amplify init failed after ${duration}ms:`, error);

        // Additional debugging information
        console.log('🔍 Debug information:');
        console.log(`- Test directory exists: ${fs.existsSync(testDir)}`);
        console.log(`- Test directory contents:`, fs.existsSync(testDir) ? fs.readdirSync(testDir) : 'N/A');
        console.log(`- Current working directory: ${process.cwd()}`);
        console.log(`- Environment variables:`, {
          NODE_ENV: process.env.NODE_ENV,
          AWS_PROFILE: process.env.AWS_PROFILE,
          AWS_REGION: process.env.AWS_REGION,
          SKIP_AMPLIFY_INIT: process.env.SKIP_AMPLIFY_INIT,
        });

        // If it's our timeout error, provide helpful guidance
        if ((error as Error).message.includes('timed out after 60 seconds')) {
          console.log('💡 This timeout suggests that initJSProjectWithProfile is hanging.');
          console.log('💡 Common causes:');
          console.log('   - Interactive prompts waiting for user input');
          console.log('   - AWS authentication issues');
          console.log('   - Network connectivity problems');
          console.log('   - Subprocess not terminating properly');
          console.log('💡 To skip this test, set SKIP_AMPLIFY_INIT=true');
        }

        throw error;
      } finally {
        // Always attempt cleanup if an app was created
        const appId = getAmplifyAppId(testDir);
        if (appId) {
          console.log(`🧹 Final cleanup - Found Amplify App ID: ${appId}`);
          deleteAmplifyApp(appId);
        }
      }
    }, 180000); // 3 minute Jest timeout (includes 20 second cleanup delay)
  });
});
