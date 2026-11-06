import * as path from 'path';
import * as fs from 'fs-extra';
import { homedir } from 'os';
// eslint-disable-next-line import/no-cycle
import { overriddenCategories, projectNotInitializedError, stateManager } from '..';

export const PathConstants = {
  // in home directory
  DotAWSDirName: '.aws',
  AWSCredentials: 'credentials',
  AWSConfig: 'config',
  DeploymentSecretsFileName: 'deployment-secrets.json',
  AmplifyAdminDirName: 'admin',

  // in project root
  AmplifyDirName: 'amplify',
  DotAmplifyDirName: '.amplify',

  // 1st Level
  DotConfigDirName: '.config',
  BackendDirName: 'backend',
  CurrentCloudBackendDirName: '#current-cloud-backend',
  HooksDirName: 'hooks',

  // resource level
  BuildDirName: 'build',
  // 2nd Level
  OverrideDirName: 'overrides',
  ProviderName: 'awscloudformation',
  CfnStacksBuildDirName: 'build',

  // FileNames
  AmplifyAdminConfigFileName: 'config.json',

  // eslint-disable-next-line spellcheck/spell-checker
  AmplifyRcFileName: '.amplifyrc',
  GitIgnoreFileName: '.gitignore',
  ProjectConfigFileName: 'project-config.json',
  AmplifyMetaFileName: 'amplify-meta.json',
  TagsFileName: 'tags.json',
  ParametersJsonFileName: 'parameters.json',
  ReadMeFileName: 'README.md',

  HooksConfigFileName: 'hooks-config.json',
  HooksShellSampleFileName: 'post-push.sh.sample',
  HooksJsSampleFileName: 'pre-push.js.sample',
  HooksReadmeFileName: 'hooks-readme.md',

  LocalEnvFileName: 'local-env-info.json',
  LocalAWSInfoFileName: 'local-aws-info.json',
  TeamProviderInfoFileName: 'team-provider-info.json',
  BackendConfigFileName: 'backend-config.json',

  CLIJSONFileName: 'cli.json',
  CLIJSONFileNameGlob: 'cli*.json',
  CLIJsonWithEnvironmentFileName: (env: string) => `cli.${env}.json`,

  CLIInputsJsonFileName: 'cli-inputs.json',

  CfnFileName: (resourceName: string) => `${resourceName}-awscloudformation-template.json`,

  CustomPoliciesFilename: 'custom-policies.json',

  DefaultFrontEndExportFolder: './exported-amplify-front-end-config',
  DefaultExportFolder: './export-amplify-stack',
  ExportManifestJsonFilename: 'amplify-export-manifest.json',
  ExportTagsJsonFileName: 'export-tags.json',
  ExportCategoryStackMappingJsonFilename: 'category-stack-mapping.json',
  OverrideFileName: 'override.ts',
};

/**
 * Utility class for normalizing paths to various files used by Amplify
 */
export class PathManager {
  private readonly homeDotAmplifyDirPath: string;
  private projectRootPath: string | undefined;

  constructor() {
    this.homeDotAmplifyDirPath = path.join(homedir(), PathConstants.DotAmplifyDirName);
  }

  getAmplifyPackageLibDirPath = (packageName: string): string => {
    // eslint-disable-next-line spellcheck/spell-checker
    const descopedPackageName = packageName.replace(/^@/, '').replace(/\//, '-');
    // eslint-disable-next-line spellcheck/spell-checker
    const result = path.join(this.getAmplifyLibRoot(), descopedPackageName);
    if (!process.env.AMPLIFY_SUPPRESS_NO_PKG_LIB && !fs.pathExistsSync(result)) {
      throw new Error(`Package lib at ${result} does not exist.`);
    }
    return result;
  };

  getAmplifyLibRoot = (): string => path.join(this.getHomeDotAmplifyDirPath(), 'lib');

  getHomeDotAmplifyDirPath = (): string => this.homeDotAmplifyDirPath;

  getAmplifyAdminDirPath = (): string => this.constructPath(this.getHomeDotAmplifyDirPath(), [PathConstants.AmplifyAdminDirName]);

  getAmplifyAdminConfigFilePath = (): string =>
    this.constructPath(this.getAmplifyAdminDirPath(), [PathConstants.AmplifyAdminConfigFileName]);

  getAmplifyDirPath = (projectPath?: string): string => this.constructPath(projectPath, [PathConstants.AmplifyDirName]);

  getDotConfigDirPath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.DotConfigDirName]);

  getBackendDirPath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.BackendDirName]);

  getCurrentCloudBackendDirPath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.CurrentCloudBackendDirName]);

  getCurrentResourceParametersJsonPath = (projectPath: string | undefined, categoryName: string, resourceName: string): string =>
    path.join(this.getCurrentCloudBackendDirPath(projectPath), categoryName, resourceName, PathConstants.ParametersJsonFileName);

  getCurrentCfnTemplatePath = (projectPath: string | undefined, categoryName: string, resourceName: string): string =>
    path.join(this.getCurrentCloudBackendDirPath(projectPath), categoryName, resourceName, PathConstants.CfnFileName(resourceName));

  getAmplifyRcFilePath = (projectPath?: string): string => this.constructPath(projectPath, [PathConstants.AmplifyRcFileName]);

  getGitIgnoreFilePath = (projectPath?: string): string => this.constructPath(projectPath, [PathConstants.GitIgnoreFileName]);

  /**
   * Returns the full path to the `team-provider-info.json` file
   * @deprecated Use envParamManager from amplify-environment-parameters
   */
  getTeamProviderInfoFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.TeamProviderInfoFileName]);

  getProjectConfigFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.DotConfigDirName, PathConstants.ProjectConfigFileName]);

  getLocalEnvFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.DotConfigDirName, PathConstants.LocalEnvFileName]);

  getLocalAWSInfoFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.DotConfigDirName, PathConstants.LocalAWSInfoFileName]);

  getAmplifyMetaFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.BackendDirName, PathConstants.AmplifyMetaFileName]);

  getBackendConfigFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.BackendDirName, PathConstants.BackendConfigFileName]);

  getTagFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.BackendDirName, PathConstants.TagsFileName]);

  getCurrentTagFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.CurrentCloudBackendDirName, PathConstants.TagsFileName]);

  getResourceDirectoryPath = (projectPath: string | undefined, category: string, resourceName: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.BackendDirName, category, resourceName]);

  getResourceInputsJsonFilePath = (projectPath: string | undefined, category: string, resourceName: string): string =>
    path.join(this.getResourceDirectoryPath(projectPath, category, resourceName), PathConstants.CLIInputsJsonFileName);

  getResourceParametersFilePath = (projectPath: string | undefined, category: string, resourceName: string): string => {
    let isBuildParametersJson = false;
    const resourceDirPath = this.getResourceDirectoryPath(projectPath, category, resourceName);
    if (
      !fs.existsSync(path.join(resourceDirPath, PathConstants.ParametersJsonFileName)) &&
      fs.existsSync(path.join(resourceDirPath, PathConstants.CLIInputsJsonFileName)) &&
      overriddenCategories.includes(category)
    ) {
      isBuildParametersJson = true;
    }
    const basePath = isBuildParametersJson ? path.join(resourceDirPath, PathConstants.BuildDirName) : resourceDirPath;
    return path.join(basePath, PathConstants.ParametersJsonFileName);
  };

  getResourceCfnTemplatePath = (
    projectPath: string | undefined,
    category: string,
    resourceName: string,
    buildDirectory = false,
  ): string => {
    const resourceDirPath = this.getResourceDirectoryPath(projectPath, category, resourceName);
    const basePath = buildDirectory ? path.join(resourceDirPath, PathConstants.BuildDirName) : resourceDirPath;
    return path.join(basePath, PathConstants.CfnFileName(resourceName));
  };

  getReadMeFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.ReadMeFileName]);

  getCurrentAmplifyMetaFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.CurrentCloudBackendDirName,
      PathConstants.AmplifyMetaFileName,
    ]);

  getCurrentBackendConfigFilePath = (projectPath?: string): string =>
    this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.CurrentCloudBackendDirName,
      PathConstants.BackendConfigFileName,
    ]);

  getDotAWSDirPath = (): string => path.normalize(path.join(homedir(), PathConstants.DotAWSDirName));

  getCustomPoliciesPath = (category: string, resourceName: string): string =>
    path.join(this.getResourceDirectoryPath(undefined, category, resourceName), PathConstants.CustomPoliciesFilename);

  getAWSCredentialsFilePath = (): string =>
    process.env.AWS_SHARED_CREDENTIALS_FILE || path.normalize(path.join(this.getDotAWSDirPath(), PathConstants.AWSCredentials));

  getAWSConfigFilePath = (): string =>
    process.env.AWS_CONFIG_FILE || path.normalize(path.join(this.getDotAWSDirPath(), PathConstants.AWSConfig));

  getCLIJSONFilePath = (projectPath: string, env?: string): string => {
    const fileName = env === undefined ? PathConstants.CLIJSONFileName : PathConstants.CLIJsonWithEnvironmentFileName(env);

    return this.constructPath(projectPath, [PathConstants.AmplifyDirName, fileName]);
  };

  getDotAWSAmplifyDirPath = (): string => path.normalize(path.join(homedir(), PathConstants.DotAWSDirName, PathConstants.AmplifyDirName));

  getDeploymentSecrets = (): string => path.normalize(path.join(this.getDotAWSAmplifyDirPath(), PathConstants.DeploymentSecretsFileName));

  getHooksDirPath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.HooksDirName]);

  getHooksConfigFilePath = (projectPath?: string): string =>
    path.join(this.getHooksDirPath(projectPath), PathConstants.HooksConfigFileName);

  getOverrideDirPath = (projectPath: string, category: string, resourceName: string): string =>
    this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.BackendDirName,
      category,
      resourceName,
      PathConstants.OverrideDirName,
    ]);

  getRootOverrideDirPath = (projectPath: string): string =>
    this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.BackendDirName,
      PathConstants.ProviderName,
      PathConstants.OverrideDirName,
    ]);

  getRootStackBuildDirPath = (projectPath: string): string =>
    this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.BackendDirName,
      PathConstants.ProviderName,
      PathConstants.BuildDirName,
    ]);

  getStackBuildCategoryResourceDirPath = (projectPath: string, category: string, resourceName: string): string =>
    this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.BackendDirName,
      PathConstants.ProviderName,
      PathConstants.BuildDirName,
      category,
      resourceName,
    ]);

  getCurrentCloudRootStackDirPath = (projectPath: string): string =>
    this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.CurrentCloudBackendDirName,
      PathConstants.ProviderName,
      PathConstants.BuildDirName,
    ]);

  getResourceOverrideFilePath = (projectPath: string | undefined, category: string, resourceName: string): string =>
    this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.BackendDirName,
      category,
      resourceName,
      PathConstants.OverrideFileName,
    ]);

  private constructPath = (projectPath?: string, segments: string[] = []): string => {
    if (!projectPath) {
      // eslint-disable-next-line no-param-reassign
      projectPath = this.findProjectRoot();
    }

    if (projectPath) {
      return path.normalize(path.join(projectPath, ...segments));
    }

    throw projectNotInitializedError();
  };

  private validateProjectPath = (projectPath: string): boolean => {
    if (fs.existsSync(projectPath)) {
      const amplifyDirPath = this.getAmplifyDirPath(projectPath);
      const dotConfigDirPath = this.getDotConfigDirPath(projectPath);
      const localEnvFilePath = this.getLocalEnvFilePath(projectPath);
      const currentCloudBackendDirPath = pathManager.getCurrentCloudBackendDirPath(projectPath);
      const backendDirPath = pathManager.getBackendDirPath(projectPath);
      const projectConfigPath = pathManager.getProjectConfigFilePath(projectPath);

      if (fs.existsSync(amplifyDirPath) && fs.existsSync(dotConfigDirPath)) {
        if (fs.existsSync(currentCloudBackendDirPath) && fs.existsSync(backendDirPath)) {
          return true;
        }

        if (fs.existsSync(projectConfigPath)) {
          return true;
        }

        if (fs.existsSync(localEnvFilePath)) {
          return projectPath === stateManager.getLocalEnvInfo(projectPath).projectPath;
        }
      }
    }

    return false;
  };

  public findProjectRoot = (): string | undefined => {
    if (this.projectRootPath !== undefined) {
      return this.projectRootPath;
    }

    let currentPath = process.cwd();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (this.validateProjectPath(currentPath)) {
        this.projectRootPath = currentPath;
        return this.projectRootPath;
      }

      const parentPath = path.dirname(currentPath);

      if (currentPath === parentPath) {
        break;
      }

      currentPath = parentPath;
    }

    return undefined;
  };
}

export const pathManager = new PathManager();
