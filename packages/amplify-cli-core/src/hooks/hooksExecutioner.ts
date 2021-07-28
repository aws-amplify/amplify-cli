import { $TSAny } from '..';
import { pathManager, stateManager } from '../state-manager';
import { HooksConfig, FileObj, EventPrefix, HooksEvent, DataParameter, ErrorParameter } from './hooksTypes';
import { defaultSupportedExt } from './hooksConstants';
import * as which from 'which';
import * as fs from 'fs-extra';
import * as path from 'path';
import execa from 'execa';
import { HooksHandler } from './hooksHandler';
import _ from 'lodash';

export async function executeHooks(
  context?: { input?: { command?: string; plugin?: string; subCommands?: string[]; argv?: string[] }; amplify?: $TSAny },
  eventPrefix?: EventPrefix,
  errorParameter?: ErrorParameter,
): Promise<void> {
  const hooksHandler = HooksHandler.initialize();

  // if input is passed and command is not defined
  if (context?.input && !hooksHandler.hooksEvent.command) hooksHandler.setHooksEventFromInput(context.input);

  // to check if any suppported events were recognised
  if (!hooksHandler.hooksEvent.command) return;

  hooksHandler.hooksEvent.eventPrefix = eventPrefix;

  const projectPath = pathManager.findProjectRoot() ?? process.cwd();
  const hooksDirPath = pathManager.getHooksDirPath(projectPath);
  if (!fs.existsSync(hooksDirPath)) {
    return;
  }

  const hooksConfig: HooksConfig = stateManager.getHooksConfigJson(projectPath) ?? {};

  const { commandHookFileObj, subCommandHookFileObj } = getHooksFileObjs(hooksDirPath, hooksHandler.hooksEvent, hooksConfig);

  let executionQueue = [commandHookFileObj, subCommandHookFileObj];
  // executionQueue changes for a post event as more specific script file - with sub-command is executed first
  if (hooksHandler.hooksEvent.eventPrefix?.localeCompare('post') === 0) executionQueue = [subCommandHookFileObj, commandHookFileObj];

  // merging because we want to remoe as many undeifined values as possible
  hooksHandler.dataParameter = _.merge(hooksHandler.dataParameter, {
    amplify: {
      environment: context?.amplify?.getEnvInfo()?.envName ?? undefined,
      command: hooksHandler.hooksEvent.command,
      subCommand: hooksHandler.hooksEvent.subCommand,
      argv: hooksHandler.hooksEvent.argv,
    },
  });

  for (let execFileObj of executionQueue) {
    if (execFileObj) {
      const runtime = getRuntime(execFileObj, hooksConfig);

      await exec(execFileObj, runtime, hooksHandler.dataParameter, errorParameter);
    }
  }
}

async function exec(
  execFileObj?: FileObj,
  runtime?: string,
  dataParameter?: DataParameter,
  errorParameter?: ErrorParameter,
): Promise<void> {
  if (!execFileObj?.filePath || !runtime) return;

  const projectRoot = pathManager.findProjectRoot() ?? process.cwd();
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
    childProcess?.stdout?.pipe(process.stdout);
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
  hooksConfig: HooksConfig,
): { commandHookFileObj?: FileObj; subCommandHookFileObj?: FileObj } {
  const extensionsSupported = getSupportedExtensions(hooksConfig);

  const allFiles = fs
    .readdirSync(hooksDirPath)
    .filter(relFilePath => fs.lstatSync(path.join(hooksDirPath, relFilePath)).isFile())
    .map(relFilePath => splitFileName(relFilePath))
    .filter(fileObj => extensionsSupported.hasOwnProperty(fileObj.extension))
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
    throw new Error(String('found duplicate hook scripts: ' + files.map(file => file.fileName).join(', ')));
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

function getRuntime(fileObj: FileObj, hooksConfig: HooksConfig): string | undefined {
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

function getSupportedExtensions(hooksConfig: HooksConfig): $TSAny {
  return { ...defaultSupportedExt, ...hooksConfig?.extension };
}
