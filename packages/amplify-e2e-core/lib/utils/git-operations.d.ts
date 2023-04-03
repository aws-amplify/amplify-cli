/**
 * Initializes a git repo in the specified directory and configures a test name and email for commits
 */
export declare const gitInit: (cwd: string) => Promise<void>;
/**
 * Stages all changed files and commits them
 */
export declare const gitCommitAll: (cwd: string, message?: string) => Promise<void>;
/**
 * Executes `git clean -fdx` in the specified directory
 */
export declare const gitCleanFdx: (cwd: string) => Promise<void>;
export declare const gitCleanFdX: (cwd: string) => Promise<void>;
/**
 * Returns a list of files that have unstaged changes in the specified directory
 */
export declare const gitChangedFiles: (cwd: string) => Promise<string[]>;
