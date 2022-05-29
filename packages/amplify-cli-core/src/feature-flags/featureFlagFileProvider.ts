import _ from 'lodash';
import { FeatureFlagConfiguration, FeatureFlagsEntry } from './featureFlagTypes';
import { FeatureFlagValueProvider } from './featureFlagValueProvider';
import { CLIEnvironmentProvider } from '../cliEnvironmentProvider';
import { stateManager } from '../state-manager'; // eslint-disable-line import/no-cycle

/**
 * Provides a feature flag file provider options type
 */
export type FeatureFlagFileProviderOptions = {
  projectPath?: string;
};

/**
 * Provides feature flag file provider class
 */
export class FeatureFlagFileProvider implements FeatureFlagValueProvider {
  constructor(private environmentProvider: CLIEnvironmentProvider, private options: FeatureFlagFileProviderOptions = {}) {}

  public load = async (): Promise<FeatureFlagConfiguration> => {
    if (!this.options.projectPath) {
      throw new Error('\'projectPath\' option is missing');
    }

    const result: FeatureFlagConfiguration = {
      project: {},
      environments: {},
    };

    // Read project level file if exists
    const projectFeatures = await this.loadConfig(this.options.projectPath);

    if (projectFeatures) {
      result.project = projectFeatures;
    }

    // Read environment level file if we have a valid environment and the file exists
    const envName = this.environmentProvider.getCurrentEnvName();

    if (envName !== '') {
      const envFeatures = await this.loadConfig(this.options.projectPath, envName);

      if (envFeatures) {
        result.environments[envName] = envFeatures;
      }
    }

    return result;
  };

  private loadConfig = async (projectPath: string, env?: string): Promise<FeatureFlagsEntry | undefined> => {
    const configFileData = <{ features: FeatureFlagsEntry }>stateManager.getCLIJSON(projectPath, env, {
      throwIfNotExist: false,
    });

    if (!configFileData || !configFileData.features) {
      return undefined;
    }

    /* eslint-disable no-param-reassign */
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const toLower = (result: any, val: any, key: string): void => {
      result[key.toLowerCase()] = val;
    };
    /* eslint-enable */

    // Convert object keys to lowercase
    const mappedFeatures = Object.keys(configFileData.features).reduce<FeatureFlagsEntry>((ffe, f) => {
      /* eslint-disable no-param-reassign */
      ffe[f.toLowerCase()] = _.transform(configFileData.features[f], toLower);
      /* eslint-enable */

      return ffe;
    }, {});

    return mappedFeatures;
  };
}
