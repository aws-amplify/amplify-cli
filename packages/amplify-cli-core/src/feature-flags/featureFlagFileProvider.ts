import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { FeatureFlags, FeatureFlagsEntry } from '.';
import { CLIEnvironmentProvider, JSONUtilities } from '..';
import { FeatureFlagValueProvider } from './featureFlagValueProvider';
import { AmplifyConfigFileName, AmplifyConfigEnvFileNameTemplate } from '../constants';

export type FeatureFlagFileProviderOptions = {
  projectPath?: string;
};

const defaultFeatureFlagFileProviderOptions: FeatureFlagFileProviderOptions = {};

export class FeatureFlagFileProvider implements FeatureFlagValueProvider {
  constructor(
    private environmentProvider: CLIEnvironmentProvider,
    private options: FeatureFlagFileProviderOptions = defaultFeatureFlagFileProviderOptions,
  ) {}

  public load = async (): Promise<FeatureFlags> => {
    if (!this.options.projectPath) {
      throw new Error(`'projectPath' option is missing`);
    }

    if (!(await fs.pathExists(this.options.projectPath))) {
      throw new Error(`Project path: '${this.options.projectPath}' does not exist.`);
    }

    let result: FeatureFlags = {
      project: {},
      environments: {},
    };

    // Read project level file exists
    const projectConfigFileName = path.join(this.options.projectPath, AmplifyConfigFileName);
    const projectFeatures = await this.loadConfig(projectConfigFileName);

    if (projectFeatures) {
      result.project = projectFeatures;
    }

    // Read environment level file if we've a valid environment and file exists
    const envName = this.environmentProvider.getCurrent();
    if (envName !== '') {
      const envConfigFileName = path.join(this.options.projectPath, AmplifyConfigEnvFileNameTemplate.replace('{env}', envName));
      const envFeatures = await this.loadConfig(envConfigFileName);

      if (envFeatures) {
        result.environments[envName] = envFeatures;
      }
    }

    return result;
  };

  private loadConfig = async (fileName: string): Promise<FeatureFlagsEntry> => {
    const configFileData = await JSONUtilities.readJson<{ features: FeatureFlagsEntry }>(fileName, {
      throwIfNotExist: false,
    });

    if (!configFileData || !configFileData.features) {
      return (undefined as unknown) as FeatureFlagsEntry;
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
