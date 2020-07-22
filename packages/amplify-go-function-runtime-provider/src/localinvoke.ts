import path from 'path';
import fs from 'fs-extra';
import portfinder from 'portfinder';

import { InvocationRequest, BuildRequest } from 'amplify-function-plugin-interface';
import { buildResourceInternal, executeCommand } from './runtime';
import { MAIN_SOURCE, MAX_PORT, BASE_PORT, BIN_LOCAL, MAIN_BINARY, MAIN_BINARY_WIN } from './constants';
import execa, { ExecaChildProcess } from 'execa';

// Go typing standards dictating JSON properties with PascalCase format
type LambdaResult = {
  Response?: string;
  Error?: string;
};

const UNKNOWN_ERROR = 'Unknown error occurred during the execution of the Lambda function';

const buildLocalInvoker = async (context: any) => {
  const localInvokerDir = path.join(__dirname, '..', 'resources', 'localinvoke');
  const isWindows = /^win/.test(process.platform);
  const localInvokeExecutableName = isWindows === true ? MAIN_BINARY_WIN : MAIN_BINARY;
  const localInvokeExecutablePath = path.join(localInvokerDir, localInvokeExecutableName);

  // Check if we need to build it or it already exists
  if (!fs.existsSync(localInvokeExecutablePath)) {
    // Build localinvoker
    context.print.info('Local invoker binary was not found, building it...');
    executeCommand(['build', MAIN_SOURCE], true, undefined, localInvokerDir);
  }

  return {
    executable: localInvokeExecutablePath,
  };
};

const startLambda = (request: InvocationRequest, portNumber: number, lambda: { executable: string; cwd: string }) => {
  const envVars = request.envVars || {};

  envVars['_LAMBDA_SERVER_PORT'] = portNumber.toString();

  const lambdaProcess: ExecaChildProcess = execa.command(lambda.executable, {
    env: envVars,
    cwd: lambda.cwd,
  });

  return lambdaProcess;
};

const stopLambda = async (lambdaProcess: ExecaChildProcess) => {
  try {
    if (lambdaProcess) {
      lambdaProcess.cancel();

      await lambdaProcess;
    }
  } catch (error) {
    // Intentionally swallowing process killing errors, as kill is propagated as error from execa, but result
    // of Lambda invocation still be success
  }
};

export const localInvoke = async (request: InvocationRequest, context: any) => {
  const localInvoker = await buildLocalInvoker(context);

  // Make sure that local invocation works with the latest source we issue a build request for the function resource
  const buildRequest: BuildRequest = {
    env: request.env,
    srcRoot: request.srcRoot,
    runtime: request.runtime,
  };

  const buildResult = await buildResourceInternal(buildRequest, context, false, true);

  // Find a free tcp port for the Lambda to launch on
  const portNumber = await portfinder.getPortPromise({
    startPort: BASE_PORT,
    stopPort: MAX_PORT,
  });

  const lambdaExecutableDir = path.join(request.srcRoot, BIN_LOCAL);
  const lambdaExecutablePath = path.join(lambdaExecutableDir, MAIN_BINARY);

  context.print.info(`Launching Lambda process, port: ${portNumber}`);

  const lambdaProcess = startLambda(request, portNumber, { executable: lambdaExecutablePath, cwd: lambdaExecutableDir });

  const envelope = {
    timeoutMilliseconds: 5000,
    port: portNumber,
    payload: request.event,
  };

  let envelopeString = JSON.stringify(envelope, null);

  // Make sure that envelope is ending with a newline because the child process expects a line input
  envelopeString += '\n';

  const processResult = execa.sync(localInvoker.executable, {
    input: envelopeString,
  });

  await stopLambda(lambdaProcess);

  if (processResult.exitCode === 0) {
    const lambdaResult: LambdaResult = JSON.parse(processResult.stdout);

    if (lambdaResult.Response) {
      return lambdaResult.Response;
    } else {
      throw new Error(lambdaResult.Error || UNKNOWN_ERROR);
    }
  } else {
    const errorMessage = processResult.stderr || UNKNOWN_ERROR;

    throw new Error(`Lambda invoker exit code: ${processResult.exitCode}, message: ${errorMessage}`);
  }
};
