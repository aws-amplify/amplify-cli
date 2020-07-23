import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { FeatureFlagConfiguration, FeatureFlagsEntry } from '.';
import { CLIEnvironmentProvider, JSONUtilities } from '..';
import { FeatureFlagValueProvider } from './featureFlagValueProvider';
import { amplifyConfigFileName, amplifyConfigEnvFileNameTemplate } from '../constants';

export type FeatureFlagFileProviderOptions = {
  projectPath?: string;
};

export class FeatureFlagFileProvider implements FeatureFlagValueProvider {
  constructor(private environmentProvider: CLIEnvironmentProvider, private options: FeatureFlagFileProviderOptions = {}) {}

  public load = async (): Promise<FeatureFlagConfiguration> => {
    if (!this.options.projectPath) {
      throw new Error(`'projectPath' option is missing`);
    }

    if (!(await fs.pathExists(this.options.projectPath))) {
      throw new Error(`Project path: '${this.options.projectPath}' does not exist.`);
    }

    const result: FeatureFlagConfiguration = {
      project: {},
      environments: {},
    };

    // Read project level file exists
    const projectConfigFileName = path.join(this.options.projectPath, amplifyConfigFileName);
    const projectFeatures = await this.loadConfig(projectConfigFileName);

    if (projectFeatures) {
      result.project = projectFeatures;
    }

    // Read environment level file if we've a valid environment and file exists
    const envName = this.environmentProvider.getCurrentEnvName();
    if (envName !== '') {
      const envConfigFileName = path.join(this.options.projectPath, amplifyConfigEnvFileNameTemplate(envName));
      const envFeatures = await this.loadConfig(envConfigFileName);

      if (envFeatures) {
        result.environments[envName] = envFeatures;
      }
    }

    return result;
  };

  private loadConfig = async (fileName: string): Promise<FeatureFlagsEntry | undefined> => {
    const configFileData = await JSONUtilities.readJson<{ features: FeatureFlagsEntry }>(fileName, {
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
