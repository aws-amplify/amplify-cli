/**
 * Tests for ConfigurationLoader
 * **Feature: amplify-gen1-to-gen2-migration-script, Property 1: Configuration validation consistency**
 */

import { ConfigurationLoader } from '../core/configuration-loader';
import { Logger } from '../utils/logger';
import { FileManager } from '../utils/file-manager';
import { LogLevel, AppConfiguration } from '../types';

describe('ConfigurationLoader', () => {
  let logger: Logger;
  let fileManager: FileManager;
  let configLoader: ConfigurationLoader;

  beforeEach(() => {
    logger = new Logger(LogLevel.ERROR); // Suppress logs during tests
    fileManager = new FileManager(logger);
    configLoader = new ConfigurationLoader(logger, fileManager, './test-apps');
  });

  describe('validateConfiguration', () => {
    it('should validate a complete valid configuration', () => {
      const validConfig: AppConfiguration = {
        app: {
          name: 'testapp',
          description: 'Test application',
          framework: 'react',
        },
        categories: {
          api: {
            type: 'GraphQL',
            authModes: ['API_KEY', 'COGNITO_USER_POOLS'],
          },
          auth: {
            signInMethods: ['email'],
            socialProviders: [],
          },
          storage: {
            buckets: [
              {
                name: 'test-bucket',
                access: ['auth', 'guest'],
              },
            ],
          },
          function: {
            functions: [
              {
                name: 'test-function',
                runtime: 'nodejs',
              },
            ],
          },
        },
      };

      const result = configLoader.validateConfiguration(validConfig);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject configuration without app metadata', () => {
      const invalidConfig = {
        categories: {},
      } as AppConfiguration;

      const result = configLoader.validateConfiguration(invalidConfig);
      expect(result.errors).toContain('App metadata is required');
    });

    it('should reject configuration without categories', () => {
      const invalidConfig = {
        app: {
          name: 'testapp',
          description: 'Test application',
        },
      } as AppConfiguration;

      const result = configLoader.validateConfiguration(invalidConfig);
      expect(result.errors).toContain('Categories configuration is required');
    });
  });
});
