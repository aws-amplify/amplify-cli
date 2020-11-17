import * as fs from 'fs-extra';
import * as path from 'path';
import {
  pathManager,
  $TSContext,
  NonEmptyDirectoryError,
  exitOnNextTick,
  CLIContextEnvironmentProvider,
  FeatureFlags,
} from 'amplify-cli-core';
import { insertAmplifyIgnore } from '../extensions/amplify-helpers/git-manager';

/**
 * Extract amplify project structure with backend-config and project-config
 */
export async function scaffoldProjectHeadless(context: $TSContext) {
  insertAmplifyIgnore(pathManager.getGitIgnoreFilePath(process.cwd()));

  const skeletonLocalDir = path.join(__dirname, '..', '..', 'templates', 'amplify-skeleton');
  const skeletonProjectDir = path.join(pathManager.getAmplifyDirPath(process.cwd()));

  await fs.copy(skeletonLocalDir, skeletonProjectDir);

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
