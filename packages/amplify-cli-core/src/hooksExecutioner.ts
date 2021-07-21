import { $TSContext, $TSAny } from '.';
import { pathManager } from './state-manager/pathManager';
import { stateManager } from './state-manager/stateManager';

import * as which from 'which';
import * as fs from 'fs-extra';
import * as path from 'path';
import execa from 'execa';

const supportedEnvEvents = ['add', 'update', 'remove', 'pull', 'checkout', 'list', 'get', 'import'];
const defaultSupportedExt = { js: { runtime: 'node' }, sh: { runtime: 'bash' } };

type FileObj = {
  baseName?: string;
  extension?: string;
  filePath?: string;
  fileName?: string;
};

type EventPrefix = 'pre' | 'post';

export type HooksEvent = {
  command: string;
  subCommand?: string;
  seperator: '-' | string;
  eventPrefix?: EventPrefix;
};

type DataParameter = {
  amplify: {
    version?: string;
    environment?: string;
    command?: string;
    subCommand?: string;
    argv?: string[];
  };
};

type ErrorParameter = { message: string; stack: string };

export async function executeHooks(
  context: $TSAny,
  eventPrefix?: EventPrefix,
  errorParameter?: ErrorParameter,
  hooksEvent?: HooksEvent,
): Promise<void> {
  hooksEvent = hooksEvent ? hooksEvent : getHooksEvent(context.input, eventPrefix);
  if (!hooksEvent) return;
  const projectPath = pathManager.findProjectRoot() ?? process.cwd();
  const hooksDirPath = pathManager.getHooksDirPath(projectPath);
  if (!fs.existsSync(hooksDirPath)) {
    return;
  }
  const hooksConfig = stateManager.getHooksConfigJson(projectPath);

  const { commandHookFileObj, subCommandHookFileObj } = getHooksFileObjs(hooksDirPath, hooksEvent, hooksConfig);

  let executionQueue = [commandHookFileObj, subCommandHookFileObj];
  if (hooksEvent.eventPrefix?.localeCompare('post') === 0) executionQueue = [subCommandHookFileObj, commandHookFileObj];

  const dataParameter: DataParameter = {
    amplify: {
      version: stateManager.getAmplifyVersion(),
      environment: context.amplify.getEnvInfo().envName,
      command: hooksEvent.command,
      subCommand: hooksEvent.subCommand,
      argv: context?.input?.argv,
    },
  };

  for (let execFileObj of executionQueue) {
    if (execFileObj) {
      const runtime = getRuntime(execFileObj, hooksConfig);

      await exec(execFileObj, runtime, dataParameter, errorParameter);
    }
  }
}

export function getHooksEvent(input: $TSAny, eventPrefix?: EventPrefix): HooksEvent | undefined {
  /**
   * returns Amplify hooks event from input object
   *
   * @param {$TSAny} input
   * @returns {HooksEvent | undefined}
   */

  let command: string = input.command;
  let subCommand: string = input.plugin;

  switch (command) {
    case 'env':
      subCommand = 'env';
      let envCommand = supportedEnvEvents.find(cmd => cmd.localeCompare(input.subCommands[0]) === 0);
      if (!envCommand) return;
      command = envCommand;
      break;
    case 'configure':
      command = 'update';
      break;
    case 'gql-compile':
      command = 'gqlcompile';
      break;
    case 'add-graphql-datasource':
      command = 'addgraphqldatasource';
      break;
  }

  if (subCommand === 'mock') {
    subCommand = command;
    command = 'mock';
  }

  return { command: command, subCommand: subCommand, eventPrefix, seperator: '-' };
}

async function exec(
  execFileObj?: FileObj,
  runtime?: string,
  dataParameter?: DataParameter,
  errorParameter?: ErrorParameter,
): Promise<void> {
  if (!execFileObj?.filePath || !runtime) return;

  const projectRoot = pathManager.findProjectRoot();
  if (!projectRoot) return;

  console.log(`\n----- ${execFileObj.baseName} execution start -----`);

  try {
    const childProcess = execa(runtime, [execFileObj.filePath], {
      cwd: projectRoot,
      env: { PATH: process.env.PATH },
      extendEnv: false,
      input: JSON.stringify({
        data: dataParameter,
        error: errorParameter ? errorParameter : undefined,
      }),
    });
    childProcess.stdout?.pipe(process.stdout);

    await childProcess;
  } catch (err) {
    if (err?.stderr?.length > 0) console.error(err.stderr);
    if (err?.exitCode) console.log(`\n${execFileObj.baseName} hook script exited with exit code ${err.exitCode}`);
    console.log('exiting Amplify process...\n');
    // TODO: add logger
    process.exit(1);
  }

  console.log(`----- ${execFileObj.baseName} execution end -----\n`);
}

function getHooksFileObjs(
  hooksDirPath: string,
  hooksEvent: HooksEvent,
  hooksConfig: $TSAny,
): { commandHookFileObj?: FileObj; subCommandHookFileObj?: FileObj } {
  const extensionsSupported = getSupportedExtensions(hooksConfig);

  const allFiles = fs
    .readdirSync(hooksDirPath)
    .filter(relFilePath => fs.lstatSync(path.join(hooksDirPath, relFilePath)).isFile())
    .map(relFilePath => splitFileName(relFilePath))
    .filter(fileObj => extensionsSupported.hasOwnProperty(fileObj.extension) && extensionsSupported.hasOwnProperty(fileObj.extension))
    .map(fileObj => ({ ...fileObj, filePath: path.join(hooksDirPath, String(fileObj.fileName)) }));

  const commandType = hooksEvent.eventPrefix ? [hooksEvent.eventPrefix, hooksEvent.command].join(hooksEvent.seperator) : hooksEvent.command;
  const commandHookFiles = allFiles.filter(fileObj => fileObj.baseName === commandType);
  const commandHookFileObj = throwOnDuplicateHooksFiles(commandHookFiles);

  let subCommandHookFiles;
  let subCommandHookFileObj: FileObj | undefined;
  if (hooksEvent.subCommand) {
    const subCommandType = hooksEvent.eventPrefix
      ? [hooksEvent.eventPrefix, hooksEvent.command, hooksEvent.subCommand].join(hooksEvent.seperator)
      : [hooksEvent.command, hooksEvent.subCommand].join(hooksEvent.seperator);

    subCommandHookFiles = allFiles.filter(fileObj => fileObj.baseName === subCommandType);
    subCommandHookFileObj = throwOnDuplicateHooksFiles(subCommandHookFiles);
  }
  return { commandHookFileObj, subCommandHookFileObj };
}

function throwOnDuplicateHooksFiles(files: FileObj[]): FileObj | undefined {
  if (files.length > 1) {
    throw Error('found duplicate hook scripts');
  } else if (files.length === 1) {
    return files[0];
  }
}

function splitFileName(filename: string): FileObj {
  const lastDotIndex = filename.lastIndexOf('.');
  const fileObject: FileObj = { fileName: filename };
  if (lastDotIndex === -1) {
    fileObject.baseName = filename;
  } else {
    fileObject.baseName = filename.substring(0, lastDotIndex);
    fileObject.extension = filename.substring(lastDotIndex + 1);
  }
  return fileObject;
}

function getRuntime(fileObj: FileObj, hooksConfig: $TSAny): string | undefined {
  const { extension } = fileObj;
  if (!extension) return;
  const isWin = process.platform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys';
  const extensionObj = getSupportedExtensions(hooksConfig)[extension];
  const runtime = isWin ? extensionObj.windows?.runtime : extensionObj.runtime;
  if (!runtime) return;
  const executablePath = which.sync(runtime, {
    nothrow: true,
  });
  if (!executablePath) {
    throw new Error(String('hooks runtime not found: ' + runtime));
  }
  return executablePath;
}

function getSupportedExtensions(hooksConfig: $TSAny): $TSAny {
  return { ...defaultSupportedExt, ...hooksConfig?.extension };
}
