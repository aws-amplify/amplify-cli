import * as path from 'path';
import * as fs from 'fs-extra';
import { homedir } from 'os';
import { NotInitializedError } from '../errors';
import { overriddenCategories } from '..';

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
};

export class PathManager {
  private readonly homeDotAmplifyDirPath: string;
  // private readonly projectRootPath: string | undefined;

  constructor() {
    this.homeDotAmplifyDirPath = path.join(homedir(), PathConstants.DotAmplifyDirName);
    // this.projectRootPath = this.findProjectRoot();
  }

  getAmplifyPackageLibDirPath = (packageName: string): string => {
    const result = path.join(this.getAmplifyLibRoot(), packageName);
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
    let isBuildParametersjson: boolean = false;
    const resourceDirPath = this.getResourceDirectoryPath(projectPath, category, resourceName);
    if (
      !fs.existsSync(path.join(resourceDirPath, PathConstants.ParametersJsonFileName)) &&
      fs.existsSync(path.join(resourceDirPath, PathConstants.CLIInputsJsonFileName)) &&
      overriddenCategories.includes(category)
    ) {
      isBuildParametersjson = true;
    }
    const basePath = isBuildParametersjson ? path.join(resourceDirPath, PathConstants.BuildDirName) : resourceDirPath;
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

  getAWSCredentialsFilePath = (): string => path.normalize(path.join(this.getDotAWSDirPath(), PathConstants.AWSCredentials));

  getAWSConfigFilePath = (): string => path.normalize(path.join(this.getDotAWSDirPath(), PathConstants.AWSConfig));

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

  getOverrideDirPath = (projectPath: string, category: string, resourceName: string): string => {
    return this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.BackendDirName,
      category,
      resourceName,
      PathConstants.OverrideDirName,
    ]);
  };

  getRootOverrideDirPath = (projectPath: string): string => {
    return this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.BackendDirName,
      PathConstants.ProviderName,
      PathConstants.OverrideDirName,
    ]);
  };

  getRootStackBuildDirPath = (projectPath: string): string => {
    return this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.BackendDirName,
      PathConstants.ProviderName,
      PathConstants.BuildDirName,
    ]);
  };

  getCurrentCloudRootStackDirPath = (projectPath: string): string => {
    return this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.CurrentCloudBackendDirName,
      PathConstants.ProviderName,
      PathConstants.BuildDirName,
    ]);
  };

  private constructPath = (projectPath?: string, segments: string[] = []): string => {
    if (!projectPath) {
      projectPath = this.findProjectRoot();
    }

    if (projectPath) {
      return path.normalize(path.join(projectPath, ...segments));
    }

    throw new NotInitializedError();
  };

  private validateProjectPath = (projectPath: string): boolean => {
    if (fs.existsSync(projectPath)) {
      const amplifyDirPath = this.getAmplifyDirPath(projectPath);
      const dotConfigDirPath = this.getDotConfigDirPath(projectPath);

      return fs.existsSync(amplifyDirPath) && fs.existsSync(dotConfigDirPath);
    }

    return false;
  };

  public findProjectRoot = (): string | undefined => {
    let currentPath = process.cwd();

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (this.validateProjectPath(currentPath)) {
        return currentPath;
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
