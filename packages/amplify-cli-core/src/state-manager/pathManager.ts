import * as path from 'path';
import * as fs from 'fs-extra';
import { homedir } from 'os';

export const PathConstants = {
  // in home directory
  DotAWSDir: '.aws',
  AWSCredentials: 'credentials',
  AWSConfig: 'config',
  AmplifyAdminDir: 'admin',

  // in project root
  AmplifyDirName: 'amplify',
  DotAmplifyDirName: '.amplify',

  // 1st Level
  DotConfigDirName: '.config',
  BackendDirName: 'backend',
  CurrentCloudBackendDirName: '#current-cloud-backend',

  // FileNames
  AmplifyAdminConfigFileName: 'config.json',

  AmplifyRcFileName: '.amplifyrc',
  GitIgnoreFileName: '.gitignore',
  ProjectConfigFileName: 'project-config.json',
  AmplifyMetaFileName: 'amplify-meta.json',
  TagsFileName: 'tags.json',
  ParametersJsonFileName: 'parameters.json',

  LocalEnvFileName: 'local-env-info.json',
  LocalAWSInfoFileName: 'local-aws-info.json',
  TeamProviderInfoFileName: 'team-provider-info.json',
  BackendConfigFileName: 'backend-config.json',

  CLIJSONFileName: 'cli.json',
  CLIJSONFileNameGlob: 'cli*.json',
  CLIJsonWithEnvironmentFileName: (env: string) => `cli.${env}.json`,
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

  getAmplifyAdminDirPath = (): string => this.constructPath(this.getHomeDotAmplifyDirPath(), [PathConstants.AmplifyAdminDir]);

  getAmplifyAdminConfigFilePath = (): string =>
    this.constructPath(this.getAmplifyAdminDirPath(), [PathConstants.AmplifyAdminConfigFileName]);

  getAmplifyDirPath = (projectPath?: string): string => this.constructPath(projectPath, [PathConstants.AmplifyDirName]);

  getDotConfigDirPath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.DotConfigDirName]);

  getBackendDirPath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.BackendDirName]);

  getCurrentCloudBackendDirPath = (projectPath?: string): string =>
    this.constructPath(projectPath, [PathConstants.AmplifyDirName, PathConstants.CurrentCloudBackendDirName]);

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

  getResourceParamatersFilePath = (projectPath: string | undefined, category: string, resourceName: string): string =>
    this.constructPath(projectPath, [
      PathConstants.AmplifyDirName,
      PathConstants.BackendDirName,
      category,
      resourceName,
      PathConstants.ParametersJsonFileName,
    ]);

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

  getDotAWSDirPath = (): string => path.normalize(path.join(homedir(), PathConstants.DotAWSDir));

  getAWSCredentialsFilePath = (): string => path.normalize(path.join(this.getDotAWSDirPath(), PathConstants.AWSCredentials));

  getAWSConfigFilePath = (): string => path.normalize(path.join(this.getDotAWSDirPath(), PathConstants.AWSConfig));

  getCLIJSONFilePath = (projectPath: string, env?: string): string => {
    const fileName = env === undefined ? PathConstants.CLIJSONFileName : PathConstants.CLIJsonWithEnvironmentFileName(env);

    return this.constructPath(projectPath, [PathConstants.AmplifyDirName, fileName]);
  };

  private constructPath = (projectPath?: string, segments: string[] = []): string => {
    if (!projectPath) {
      projectPath = this.findProjectRoot();
    }

    if (projectPath) {
      return path.normalize(path.join(projectPath, ...segments));
    }

    throw this.createNotInitializedError();
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

  private createNotInitializedError = (): Error => {
    const error = new Error(
      "You are not working inside a valid Amplify project.\nUse 'amplify init' in the root of your app directory to initialize your project, or 'amplify pull' to pull down an existing project.",
    );

    error.name = 'NotInitialized';
    error.stack = undefined;

    return error;
  };
}

export const pathManager = new PathManager();
