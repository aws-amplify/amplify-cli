import * as execa from 'execa';

export const executeCommand = (executableName: string, args: string[], cwd: string | undefined = undefined): string => {
  const output = execa.sync(executableName, args, { cwd });
  if (output.exitCode !== 0) {
    throw new Error(`"${executableName}" failed with exit code: ${output.exitCode}`);
  }
  return output.stdout;
};
