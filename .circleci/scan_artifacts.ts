import * as execa from 'execa';
import * as path from 'path';
const DEFAULT_SEARCH_FOLDER = path.normalize(path.join(__dirname, '..'));
export const hasMatchingContentInFolder = (
  patterns: string[],
  folder = DEFAULT_SEARCH_FOLDER,
  excludeFolder = '{*/node_modules,.git}',
): boolean => {
  const patternParam = patterns.reduce<string[]>((acc, v) => [...acc, '-e', v], []);
  try {
    execa.sync('grep', ['-r', `--exclude-dir=${excludeFolder}`, ...patternParam, folder]);
    return true;
  } catch (e) {
    // When there is no match exit code is set to 1
    if (e.exitCode === 1) {
      return false;
    }
    throw new Error('Scanning artifacts failed');
  }
};

const main = () => {
  const envVarNameWithCredentialValues = (process.env.ENV_VAR_WITH_SECRETS || '').split(',').map(v => v.trim());
  const values = envVarNameWithCredentialValues.map(v => process.env[v]).filter(Boolean);
  if (values.length) {
    const hasContent = hasMatchingContentInFolder(values);
    if (hasContent) {
      console.log('Scanning artifact has found secret value. Failing the build');
      process.exit(1);
    }
  }
};

main();
