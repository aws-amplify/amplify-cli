import path from 'path';
import fs from 'fs-extra';
import { $TSContext, pathManager } from '@aws-amplify/amplify-cli-core';
import getPort from 'get-port';
import { InvocationRequest } from '@aws-amplify/amplify-function-plugin-interface';
import { executeCommand } from './runtime';
import { MAIN_SOURCE, MAX_PORT, BASE_PORT, BIN_LOCAL, MAIN_BINARY, MAIN_BINARY_WIN, packageName, relativeShimSrcPath } from './constants';
import execa, { ExecaChildProcess } from 'execa';

// Go typing standards dictating JSON properties with PascalCase format
type LambdaResult = {
  Response?: string;
  Error?: string;
};

const UNKNOWN_ERROR = 'Unknown error occurred during the execution of the Lambda function';

const buildLocalInvoker = async (context: any) => {
  const localInvokerDir = path.join(pathManager.getAmplifyPackageLibDirPath(packageName), relativeShimSrcPath);
  const isWindows = /^win/.test(process.platform);
  const localInvokeExecutableName = isWindows === true ? MAIN_BINARY_WIN : MAIN_BINARY;
  const localInvokeExecutablePath = path.join(localInvokerDir, localInvokeExecutableName);

  // Check if we need to build it or it already exists
  if (!fs.existsSync(localInvokeExecutablePath)) {
    // Build localInvoker
    context.print.info('Local invoker binary was not found, building it...');
    executeCommand(['mod', 'tidy'], true, undefined, localInvokerDir);
    executeCommand(['build', '-o', 'bootstrap', MAIN_SOURCE], true, undefined, localInvokerDir);
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
    extendEnv: false,
    cwd: lambda.cwd,
    stderr: 'inherit',
    stdout: 'inherit',
  });

  return lambdaProcess;
};

const stopLambda = async (lambdaProcess?: ExecaChildProcess) => {
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

export const localInvoke = async (request: InvocationRequest, context: $TSContext) => {
  const localInvoker = await buildLocalInvoker(context);

  // Find a free tcp port for the Lambda to launch on
  const portNumber = await getPort({ port: getPort.makeRange(BASE_PORT, MAX_PORT) });

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
      try {
        return JSON.parse(lambdaResult.Response);
      } catch {
        return lambdaResult.Response;
      }
    } else {
      throw new Error(lambdaResult.Error || UNKNOWN_ERROR);
    }
  } else {
    const errorMessage = processResult.stderr || UNKNOWN_ERROR;

    throw new Error(`Lambda invoker exit code: ${processResult.exitCode}, message: ${errorMessage}`);
  }
};
