/**
 * Tests for AmplifyInitializer
 */

import { AmplifyInitializer } from '../core';
import { Logger } from '../utils/logger';
import { AppConfiguration, LogLevel } from '../types';
import { initJSProjectWithProfile } from '@aws-amplify/amplify-e2e-core';
import fs from 'fs';

// Mock the e2e-core functions
jest.mock('@aws-amplify/amplify-e2e-core', () => ({
  initJSProjectWithProfile: jest.fn(),
  initProjectWithAccessKey: jest.fn(),
}));

describe('AmplifyInitializer', () => {
  let logger: Logger;
  let amplifyInitializer: AmplifyInitializer;

  beforeEach(() => {
    console.log('🧪 Setting up AmplifyInitializer unit test...');
    logger = new Logger(LogLevel.ERROR); // Use ERROR level to suppress logs during tests
    amplifyInitializer = new AmplifyInitializer(logger);
    jest.clearAllMocks();
    console.log('✅ Test setup complete');
  });

  describe('buildInitSettings', () => {
    it('should build correct settings for different app configurations', () => {
      console.log('🔧 Testing buildInitSettings method...');

      const config = {
        app: {
          name: 'customappname',
          description: 'Custom application',
        },
        categories: {
          api: {
            type: 'GraphQL' as const,
            authModes: ['COGNITO_USER_POOLS' as const],
          },
          auth: {
            signInMethods: ['email' as const],
            socialProviders: [],
          },
        },
      };

      console.log(`📋 Input configuration:`, JSON.stringify(config, null, 2));

      const deploymentName = 'customAppDeployName';

      console.log(`📝 Deployment name: ${deploymentName}`);

      const profile = 'test-profile';
      console.log(`📝 Profile: ${profile}`);

      const settings = (amplifyInitializer as any).buildInitSettings({ config, deploymentName, profile });

      console.log(`⚙️  Generated settings:`, JSON.stringify(settings, null, 2));

      expect(settings.name).toBe(deploymentName);
      expect(settings.envName).toBe('main');
      expect(settings.framework).toBe('react');
      expect(settings.editor).toBe('Visual Studio Code');
      expect(settings.srcDir).toBe('src');
      expect(settings.distDir).toBe('dist');
      expect(settings.buildCmd).toBe('npm run build');
      expect(settings.startCmd).toBe('npm run start');
      expect(settings.profileName).toBe('test-profile');

      console.log('✅ All settings validation checks passed');
    });
  });

  describe('initializeApp', () => {
    it('should call initJSProjectWithProfile with correct settings', async () => {
      console.log('🚀 Testing initializeApp with mocked initJSProjectWithProfile...');

      const config: AppConfiguration = {
        app: {
          name: 'mytestapp',
          description: 'Test application',
          framework: 'react',
        },
        categories: {},
      };

      const appPath = '/path/to/app';

      console.log('📋 Test config:', JSON.stringify(config, null, 2));
      console.log('📁 App path:', appPath);

      // Mock fs operations for path validation
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      const deploymentName = 'mytestapp';
      const profile = 'test-profile';
      const startTime = Date.now();
      await amplifyInitializer.initializeApp({
        appPath,
        config,
        deploymentName,
        profile,
      });
      const duration = Date.now() - startTime;

      console.log(`⏰ Test completed in ${duration}ms`);

      expect(initJSProjectWithProfile).toHaveBeenCalledWith(appPath, {
        name: 'mytestapp',
        envName: 'main',
        editor: 'Visual Studio Code',
        framework: 'react',
        srcDir: 'src',
        distDir: 'dist',
        buildCmd: 'npm run build',
        startCmd: 'npm run start',
        profileName: 'test-profile',
        disableAmplifyAppCreation: false,
      });

      console.log('✅ initializeApp test passed');
    });

    it('should handle errors from initJSProjectWithProfile', async () => {
      console.log('❌ Testing error handling in initializeApp...');

      const error = new Error('Init failed');
      // @ts-ignore
      initJSProjectWithProfile.mockRejectedValue(error);

      const config: AppConfiguration = {
        app: {
          name: 'testapp',
          description: 'Test application',
          framework: 'react',
        },
        categories: {},
      };

      // Mock fs operations for path validation
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {});
      jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      console.log('🧪 Expecting initialization to fail...');
      const deploymentName = 'testapp';
      const profile = 'test-profile';

      await expect(amplifyInitializer.initializeApp({ appPath: '/path/to/app', config, deploymentName, profile })).rejects.toThrow(
        'Failed to initialize Amplify app: testapp',
      );

      console.log('✅ Error handling test passed');
    });

    it('should validate app name constraints', async () => {
      console.log('🔍 Testing app name validation...');

      // Test invalid names
      const invalidNames = [
        { name: 'ap', expectedError: 'App name must be between 3-20 characters' },
        { name: 'verylongapplicationnamethatexceedslimit', expectedError: 'App name must be between 3-20 characters' },
        { name: 'my-app', expectedError: 'App name must contain only alphanumeric characters' },
        { name: 'my_app', expectedError: 'App name must contain only alphanumeric characters' },
        { name: 'app@123', expectedError: 'App name must contain only alphanumeric characters' },
        { name: '', expectedError: 'App name is required' },
      ];

      for (const { name, expectedError } of invalidNames) {
        const config = {
          app: { name, description: 'Test app', framework: 'react' },
          categories: {},
        };

        const profile = 'test-profile';

        // Use the invalid name as the deploymentName to test validation
        await expect(amplifyInitializer.initializeApp({ appPath: '/valid/path', config, deploymentName: name, profile })).rejects.toThrow(
          expectedError,
        );

        console.log(`  ❌ Correctly rejected: "${name}"`);
      }
    });
  });
});
