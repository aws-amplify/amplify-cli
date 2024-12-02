import path from 'path';
import fs from 'fs-extra';
import execa from 'execa';
import { InvocationRequest } from '@aws-amplify/amplify-function-plugin-interface';
import { executableName } from '../constants';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';

export const invoke = async (request: InvocationRequest): Promise<string> => {
  const sourcePath = path.join(request.srcRoot, 'src');
  let result: execa.ExecaSyncReturnValue<string>;
  let tempDir = '';
  let eventFile = '';
  try {
    tempDir = fs.mkdtempSync(path.join(request.srcRoot, 'amplify'));
    eventFile = path.join(tempDir, 'event.json');
    fs.writeFileSync(eventFile, request.event);
    const lambdaTestTool = 'lambda-test-tool-8.0';
    const execPromise = execa(
      executableName,
      [lambdaTestTool, '--no-ui', '--function-handler', request.handler, '--payload', eventFile, '--pause-exit', 'false'],
      {
        cwd: sourcePath,
        env: request.envVars,
      },
    );
    execPromise.stderr?.pipe(process.stderr);
    execPromise.stdout?.pipe(process.stdout);
    result = await execPromise;
  } catch (err) {
    throw new AmplifyError('LambdaFunctionInvokeError', { message: `Test failed, error message was ${err.message}` }, err);
  } finally {
    // Clean up
    if (tempDir && fs.existsSync(tempDir)) {
      fs.emptyDirSync(tempDir);
      fs.removeSync(tempDir);
    }
  }

  if (result.exitCode !== 0) {
    throw new AmplifyError('LambdaFunctionInvokeError', { message: `Test failed, exit code was ${result.exitCode}` });
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
