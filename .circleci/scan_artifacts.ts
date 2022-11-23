import * as execa from 'execa';
import * as path from 'path';
import { ARTIFACT_STORAGE_PATH_ALLOW_LIST } from '../scripts/artifact-storage-path-allow-list';
const REPO_FOLDER = path.normalize(path.join(__dirname, '..', '..'));
export const hasMatchingContentInFolder = (
  patterns: string[],
  folder: string,
  excludeFolder = '{node_modules,.cache,.git,\.cache,\.git}',
): boolean => {
  console.log("Scanning folder:", folder);
  const patternParam = patterns.reduce<string[]>((acc, v) => [...acc, '-e', v], []);

  let actualFolder = folder;
  if(folder.startsWith("~/")){
    actualFolder = folder.replace("~", REPO_FOLDER);
  }

  try {
    execa.sync('grep', ['-r', `--exclude-dir=${excludeFolder}`, ...patternParam, actualFolder]);
    return true;
  } catch (e) {
    // When there is no match exit code is set to 1
    if (e.exitCode === 1) {
      return false;
    }
    if (e.message.includes('No such file or directory')){
      console.log("No artifacts found at:", actualFolder);
      return false;
    }
    throw new Error('Scanning artifacts failed');
  }
};

const main = () => {
  const envVarNameWithCredentialValues = (process.env.ENV_VAR_WITH_SECRETS || '').split(',').map(v => v.trim());
  const values = envVarNameWithCredentialValues.map(v => process.env[v]).filter(Boolean);
  if (values.length) {
    for(let folder of ARTIFACT_STORAGE_PATH_ALLOW_LIST){
      console.log("Original folder:", folder);
      const normalizedFolder = path.normalize(folder);
      console.log("Normalized folder:", normalizedFolder);
      const hasContent = hasMatchingContentInFolder(values, path.normalize(folder));
      if (hasContent) {
        console.log('Scanning artifact has found secret value. Failing the build');
        process.exit(1);
      }
    }
  }
};

main();
