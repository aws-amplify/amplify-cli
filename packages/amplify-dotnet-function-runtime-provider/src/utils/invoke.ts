import path from 'path';
import fs from 'fs-extra';
import execa from 'execa';
import { InvocationRequest } from 'amplify-function-plugin-interface';
import { executableName } from '../constants';

export const invoke = async (request: InvocationRequest): Promise<string> => {
  const sourcePath = path.join(request.srcRoot, 'src');
  let result: execa.ExecaSyncReturnValue<string>;
  let tempDir: string = '';
  let eventFile: string = '';
  try {
    tempDir = fs.mkdtempSync(path.join(request.srcRoot, 'amplify'));
    eventFile = path.join(tempDir, 'event.json');
    fs.writeFileSync(eventFile, request.event);
    const execPromise = execa(
      executableName,
      ['lambda-test-tool-6.0', '--no-ui', '--function-handler', request.handler, '--payload', eventFile, '--pause-exit', 'false'],
      {
        cwd: sourcePath,
        env: request.envVars,
      },
    );
    execPromise.stderr?.pipe(process.stderr);
    execPromise.stdout?.pipe(process.stdout);
    result = await execPromise;
  } finally {
    // Clean up
    if (tempDir && fs.existsSync(tempDir)) {
      fs.emptyDirSync(tempDir);
      fs.removeSync(tempDir);
    }
  }

  if (result.exitCode !== 0) {
    throw new Error(`Test failed, exit code was ${result.exitCode}`);
  }

  const { stdout } = result;
  const lines = stdout.split('\n');
  const lastLine = lines[lines.length - 1];
  let output = lastLine;
  try {
    output = JSON.parse(lastLine);
  } catch (err) {
    // swallow this and return the raw line
  }
  return output;
};
