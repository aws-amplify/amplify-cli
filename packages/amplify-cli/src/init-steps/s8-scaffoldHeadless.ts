import * as fs from 'fs-extra';
import * as path from 'path';
import {
  $TSContext,
  AmplifyProjectConfig,
  CLIContextEnvironmentProvider,
  FeatureFlags,
  JSONUtilities,
  PathConstants,
  pathManager,
} from 'amplify-cli-core';
import { insertAmplifyIgnore } from '../extensions/amplify-helpers/git-manager';

/**
 * Extract amplify project structure with backend-config and project-config
 */
export async function scaffoldProjectHeadless(context: $TSContext) {
  const projectPath = process.cwd();
  const { projectName, frontend } = context.exeInfo.projectConfig;

  const skeletonLocalDir = path.join(__dirname, '..', '..', 'templates', 'amplify-skeleton');

  // create amplify folder
  const destFolder = pathManager.getAmplifyDirPath(projectPath);
  await fs.ensureDir(destFolder);

  // create .config folder
  await fs.ensureDir(pathManager.getDotConfigDirPath(projectPath));

  // copy project-config.json file
  const projectConfigFile = JSONUtilities.readJson<AmplifyProjectConfig>(
    path.join(skeletonLocalDir, PathConstants.DotConfigDirName, `project-config__${frontend}.json`),
  );

  if (!projectConfigFile) {
    throw new Error(`project-config.json template not found for frontend: ${frontend}`);
  }

  projectConfigFile['projectName'] = projectName;
  JSONUtilities.writeJson(pathManager.getProjectConfigFilePath(projectPath), projectConfigFile);

  // copy backend folder
  await fs.copy(path.join(skeletonLocalDir, PathConstants.BackendDirName), pathManager.getBackendDirPath(projectPath));

  insertAmplifyIgnore(pathManager.getGitIgnoreFilePath(projectPath));

  // Initialize feature flags
  const contextEnvironmentProvider = new CLIContextEnvironmentProvider({
    getEnvInfo: () => {
      return context.exeInfo.localEnvInfo;
    },
  });

  if (!FeatureFlags.isInitialized()) {
    await FeatureFlags.initialize(contextEnvironmentProvider, true);
  }

  await FeatureFlags.ensureDefaultFeatureFlags(true);
}
