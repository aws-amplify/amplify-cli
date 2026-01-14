/**
 * Tests for ConfigurationLoader
 * **Feature: amplify-gen1-to-gen2-migration-script, Property 1: Configuration validation consistency**
 */

import * as fc from 'fast-check';
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
          hosting: {
            type: 'amplify-console',
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

    /**
     * Property-based test for configuration validation consistency
     * **Feature: amplify-gen1-to-gen2-migration-script, Property 1: Configuration validation consistency**
     */
    it('should consistently validate configurations with required fields', () => {
      fc.assert(
        fc.property(
          fc.record({
            app: fc.record({
              name: fc.string({ minLength: 1 }),
              description: fc.string(),
              framework: fc.string(),
            }),
            categories: fc.record({}),
          }),
          (config: AppConfiguration) => {
            const result = configLoader.validateConfiguration(config);

            // Property: Any configuration with valid app metadata and categories should pass basic validation
            const hasValidApp = config.app && config.app.name && config.app.name.length > 0;
            const hasCategories = config.categories !== undefined;

            if (hasValidApp && hasCategories) {
              // Should not have app metadata errors
              expect(result.errors.filter((e) => e.includes('App metadata') || e.includes('App name'))).toHaveLength(0);
              expect(result.errors.filter((e) => e.includes('Categories configuration'))).toHaveLength(0);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('should validate API configuration correctly', () => {
      const configWithInvalidAPI: AppConfiguration = {
        app: {
          name: 'testapp',
          description: 'Test application',
          framework: 'react',
        },
        categories: {
          api: {
            type: 'InvalidType' as any,
            authModes: 'not-an-array' as any,
          },
        },
      };

      const result = configLoader.validateConfiguration(configWithInvalidAPI);
      expect(result.errors).toContain('API type must be either GraphQL or REST');
      expect(result.errors).toContain('API authModes must be an array');
    });

    it('should validate Auth configuration correctly', () => {
      const configWithInvalidAuth: AppConfiguration = {
        app: {
          name: 'testapp',
          description: 'Test application',
          framework: 'react',
        },
        categories: {
          auth: {
            signInMethods: 'not-an-array' as any,
            socialProviders: 'not-an-array' as any,
          },
        },
      };

      const result = configLoader.validateConfiguration(configWithInvalidAuth);
      expect(result.errors).toContain('Auth signInMethods must be an array');
      expect(result.errors).toContain('Auth socialProviders must be an array');
    });

    it('should validate Storage configuration correctly', () => {
      const configWithInvalidStorage: AppConfiguration = {
        app: {
          name: 'testapp',
          description: 'Test application',
          framework: 'react',
        },
        categories: {
          storage: {
            buckets: 'not-an-array' as any,
          },
        },
      };

      const result = configLoader.validateConfiguration(configWithInvalidStorage);
      expect(result.errors).toContain('Storage buckets must be an array');
    });

    it('should validate Function configuration correctly', () => {
      const configWithInvalidFunction: AppConfiguration = {
        app: {
          name: 'testapp',
          description: 'Test application',
          framework: 'react',
        },
        categories: {
          function: {
            functions: [
              {
                name: '',
                runtime: undefined as any,
              },
            ],
          },
        },
      };

      const result = configLoader.validateConfiguration(configWithInvalidFunction);
      expect(result.errors).toContain('Function at index 0 must have a name');
      expect(result.errors).toContain('Function at index 0 must have a runtime');
    });

    it('should validate Hosting configuration correctly', () => {
      const configWithInvalidHosting: AppConfiguration = {
        app: {
          name: 'testapp',
          description: 'Test application',
          framework: 'react',
        },
        categories: {
          hosting: {
            type: 'invalid-type' as any,
          },
        },
      };

      const result = configLoader.validateConfiguration(configWithInvalidHosting);
      expect(result.errors).toContain('Hosting type must be either amplify-console or s3-cloudfront');
    });
  });
});
