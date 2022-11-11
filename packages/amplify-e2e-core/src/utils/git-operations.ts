import execa from 'execa';

/**
 * Initializes a git repo in the specified directory and configures a test name and email for commits
 */
export const gitInit = async (cwd: string): Promise<void> => {
  await execa('git', ['init'], { cwd });
  await execa('git', ['config', 'user.email', 'e2e-test@test.com'], { cwd });
  await execa('git', ['config', 'user.name', 'E2E Test'], { cwd });
};

/**
 * Stages all changed files and commits them
 */
export const gitCommitAll = async (cwd: string, message = 'e2e core committing all staged files'): Promise<void> => {
  await execa('git', ['add', '.'], { cwd });
  await execa('git', ['commit', '-m', message], { cwd });
};

/**
 * Executes `git clean -fdx` in the specified directory
 */
export const gitCleanFdx = async (cwd: string): Promise<void> => {
  await execa('git', ['clean', '-fdx'], { cwd });
};

/**
 * Returns a list of files that have unstaged changes in the specified directory
 */
export const gitChangedFiles = async (cwd: string): Promise<string[]> => {
  const { stdout } = await execa('git', ['diff', '--name-only'], { cwd });
  return stdout
    .trim()
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .sort();
};
