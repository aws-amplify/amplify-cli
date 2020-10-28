import _ from 'lodash';
import { FeatureFlagConfiguration, FeatureFlagsEntry } from '.';
import { CLIEnvironmentProvider } from '..';
import { FeatureFlagValueProvider } from './featureFlagValueProvider';
import { stateManager } from '../state-manager';

export type FeatureFlagFileProviderOptions = {
  projectPath?: string;
};

export class FeatureFlagFileProvider implements FeatureFlagValueProvider {
  constructor(private environmentProvider: CLIEnvironmentProvider, private options: FeatureFlagFileProviderOptions = {}) {}

  public load = async (): Promise<FeatureFlagConfiguration> => {
    if (!this.options.projectPath) {
      throw new Error(`'projectPath' option is missing`);
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

    const toLower = (result: any, val: any, key: string) => {
      result[key.toLowerCase()] = val;
    };

    // Convert object keys to lowercase
    const mappedFeatures = Object.keys(configFileData.features).reduce<FeatureFlagsEntry>((ffe, f) => {
      ffe[f.toLowerCase()] = _.transform(configFileData.features[f], toLower);

      return ffe;
    }, {});

    return mappedFeatures;
  };
}
