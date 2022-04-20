import * as path from 'path';
import * as _ from 'lodash';
import { config as dotenvConfig } from 'dotenv';

import { EnvVarFormatError } from './envVarFormatError';
import { FeatureFlagConfiguration } from './featureFlagTypes';
import { FeatureFlagValueProvider } from './featureFlagValueProvider';

/**
 * Provides feature flag environment provider options type
 */
export type FeatureFlagEnvironmentProviderOptions = {
  prefix?: string;
  environmentNameSeparator?: string;
  noEnvironmentNameSeparator?: string;
  envPathSeparator?: string;
  internalSeparator?: string;
  projectPath?: string;
};

const defaultFeatureFlagEnvironmentProviderOptions = {
  prefix: 'AMPLIFYCLI',
  environmentNameSeparator: '-',
  noEnvironmentNameSeparator: '_',
  envPathSeparator: '__',
  internalSeparator: ':',
};

/**
 * Using the environment variables of the current process and a .env file to transform those into feature flags values.
 * The resulting object has a 'project' member and an 'environments' member. 'project' contains the project level feature flags,
 * 'environments' contains objects, each keyed by the name of the environment the flags are defined for.
 *
 * Environment variables must have this format:
 * {prefix}_{section}__{property} or {prefix}-{CLI environment name}_{section}__{property}
 */
export class FeatureFlagEnvironmentProvider implements FeatureFlagValueProvider {
  constructor(private options: FeatureFlagEnvironmentProviderOptions = defaultFeatureFlagEnvironmentProviderOptions) {
    this.options = {
      ...defaultFeatureFlagEnvironmentProviderOptions,
      ...options,
    };
  }

  public load = (): Promise<FeatureFlagConfiguration> => new Promise((resolve, reject) => {
    if (!process.env) {
      resolve({
        project: {},
        environments: {},
      });
    }

    // Load .env file from the project's directory (cwd if not passed in)
    const envFilePath = this.options.projectPath ? path.join(this.options.projectPath, '.env') : undefined;

    dotenvConfig({
      path: envFilePath,
    });

    const variableReducer = (result: FeatureFlagConfiguration, key: string): FeatureFlagConfiguration => {
      if (key.startsWith(this.options.prefix!) && process.env[key] !== undefined) {
        let normalizedKey = key
          .toLowerCase()
          .slice(this.options.prefix!.length)
          .replace(this.options.envPathSeparator!, this.options.internalSeparator!);

        if (normalizedKey.startsWith(this.options.environmentNameSeparator!)) {
          // Check if variable name starts with Amplify environment separator or not

          normalizedKey = normalizedKey.slice(this.options.environmentNameSeparator!.length);

          const [env, envRemaining] = this.parseUntilNextSeparator(key, normalizedKey, this.options.noEnvironmentNameSeparator!);
          const [section, property] = this.parseUntilNextSeparator(key, envRemaining, this.options.internalSeparator!);

          this.setValue(result, env, section, property, process.env[key]);
        } else if (normalizedKey.startsWith(this.options.noEnvironmentNameSeparator!)) {
          // Check if variable name starts with Amplify path separator character or not

          normalizedKey = normalizedKey.slice(this.options.noEnvironmentNameSeparator!.length);

          const [section, property] = this.parseUntilNextSeparator(key, normalizedKey, this.options.internalSeparator!);

          this.setValue(result, null, section, property, process.env[key]);
        } else {
          // Throw error since the format of the environment variable is incorrect, could be a mistake
          // skipping it could cause hard to find errors for customers. Error message does not contain the value
          // since that can be sensitive data.
          reject(new EnvVarFormatError(key));
        }
      }

      return result;
    };

    const variableMap = Object.keys(process.env).reduce<FeatureFlagConfiguration>(
      (result: FeatureFlagConfiguration, key) => variableReducer(result, key),
      {
        project: {},
        environments: {},
      },
    );

    resolve(variableMap);
  });

  private parseUntilNextSeparator = (key: string, input: string, separator: string, throwIfNotFound = true): [string, string] => {
    const separatorIndex = input.indexOf(separator);

    if (separatorIndex <= 0 && throwIfNotFound) {
      throw new EnvVarFormatError(key);
    }

    const part = input.substring(0, separatorIndex);
    const remaining = input.slice(separatorIndex + separator.length);

    // After slicing both string must contain a value
    if (part.length === 0 || remaining.length === 0) {
      throw new EnvVarFormatError(key);
    }

    return [part, remaining];
  };

  private setValue = (
    featureFlags: FeatureFlagConfiguration,
    environment: string | null,
    section: string,
    property: string,
    value?: string,
  ): void => {
    if (!value) {
      return;
    }

    if (environment === null) {
      _.set(featureFlags, ['project', section, property], value);
    } else {
      _.set(featureFlags, ['environments', environment, section, property], value);
    }
  };
}
