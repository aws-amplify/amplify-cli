import path from 'path';
import fs from 'fs-extra';
import * as execa from 'execa';
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
    result = execa.sync(
      executableName,
      ['lambda-test-tool-3.1', '--no-ui', '--function-handler', request.handler, '--payload', eventFile, '--pause-exit', 'false'],
      {
        cwd: sourcePath,
        env: {
          ...process.env,
          ...request.envVars,
        },
      },
    );
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

  return result.stdout;
};
