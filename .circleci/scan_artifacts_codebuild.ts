import * as execa from 'execa';
import * as path from 'path';

// This list contains a platform agnostic list of paths where artifacts are stored after each test.
import { ARTIFACT_STORAGE_PATH_ALLOW_LIST_CODEBUILD } from '../scripts/artifact-storage-path-allow-list-codebuild';

const ROOT_FOLDER_ABSOLUTE_PATH = process.env.CODEBUILD_SRC_DIR as string;

export const hasMatchingContentInFolder = (patterns: string[], folder: string, excludeFolder = '{node_modules,.cache,.git}'): boolean => {
  console.log('Scanning folder:', folder);
  const patternParam = patterns.reduce<string[]>((acc, v) => [...acc, '-e', v], []);

  try {
    execa.sync('grep', ['-r', `--exclude-dir=${excludeFolder}`, ...patternParam, folder]);
    return true;
  } catch (e) {
    // When there is no match exit code is set to 1
    if (e.exitCode === 1) {
      return false;
    }
    if (e.message.includes('No such file or directory')) {
      console.log('No artifacts found at:', folder);
      return false;
    }
    throw new Error('Scanning artifacts failed');
  }
};

const main = () => {
  console.log(process.env.CODEBUILD_SRC_DIR);
  const envVarNameWithCredentialValues = (process.env.ENV_VAR_WITH_SECRETS || '').split(',').map((v) => v.trim());
  const values = envVarNameWithCredentialValues.map((v) => process.env[v]).filter(Boolean);
  if (values.length) {
    for (let folder of ARTIFACT_STORAGE_PATH_ALLOW_LIST_CODEBUILD) {
      if (folder.startsWith('$CODEBUILD_SRC_DIR')) {
        const normalizedFolder = path.normalize(folder.replace('$CODEBUILD_SRC_DIR', ROOT_FOLDER_ABSOLUTE_PATH));
        const hasContent = hasMatchingContentInFolder(values as string[], normalizedFolder);
        if (hasContent) {
          console.log('Scanning artifact has found secret value. Failing the build: ', normalizedFolder);
          process.exit(1);
        }
      } else {
        console.log('Paths in ARTIFACT_STORAGE_PATH_ALLOW_LIST_CODEBUILD must start with ~/');
        console.log('Update the path to use ~/ and make sure to do the same in the config.yaml/config.base.yaml files');
        process.exit(1);
      }
    }
  }
};

main();
