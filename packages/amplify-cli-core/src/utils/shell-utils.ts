import * as execa from 'execa';
import { AmplifyError } from '..';

// wrapper for executing a shell command and returning the result as a string promise
// opts are passed directly to the exec command
export const execWithOutputAsString = async (command: string, opts?: execa.Options): Promise<string> => {
  try {
    let stdout = (await execa.command(command, opts)).stdout;

    if (stdout) {
      stdout = stdout.trim();
    }

    return stdout;
  } catch (err) {
    throw new AmplifyError('ShellCommandExecutionError', { message: `Received error [${err}] running command [${command}]` });
  }
};
