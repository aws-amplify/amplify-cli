import path from 'path';
import childProcess from 'child_process';
import { InvocationRequest } from 'amplify-function-plugin-interface';

export async function invoke(request: InvocationRequest): Promise<InvocationRequest> {
  return new Promise<InvocationRequest>((resolve, reject) => {
    const shimPath = path.join(request.srcRoot, 'src', 'InvocationShim');

    const invokeCommand = childProcess.spawn('dotnet', ['run'], {
      cwd: shimPath,
      env: {
        ...process.env,
        ...request.envVars,
      },
      stdio: ['pipe', process.stdout, process.stderr],
    });

    invokeCommand.stdin.setDefaultEncoding('utf-8');
    invokeCommand.stdin.write(request.event);
    invokeCommand.stdin.end();
    invokeCommand.on('close', code => {
      if (code === 0) {
        return resolve();
      } else {
        return reject();
      }
    });
  });
}
