import * as which from 'which';
import * as fs from 'fs-extra';
import * as path from 'path';
import execa from 'execa';
import _ from 'lodash';
import { EOL } from 'os';
import { printer } from 'amplify-prompts';
import { getLogger } from '../logger/index';
import { HooksMeta } from './hooksMeta';
import { skipHooks } from './skipHooks';
import { defaultSupportedExt, hookFileSeparator } from './hooksConstants';
import { HooksConfig, HookExtensions, HookFileMeta, HookEvent, DataParameter, ErrorParameter } from './hooksTypes';
import { pathManager, stateManager } from '../state-manager';

const logger = getLogger('amplify-cli-core', 'hooks/hooksExecutioner.ts');

/**
 * execute hooks present in the hooks directory
 */
export const executeHooks = async (hooksMeta: HooksMeta): Promise<void> => {
  if (skipHooks()) {
    return;
  }

  const projectPath = pathManager.findProjectRoot() ?? process.cwd();
  const hooksDirPath = pathManager.getHooksDirPath(projectPath);
  if (!fs.existsSync(hooksDirPath)) {
    return;
  }

  const hooksConfig: HooksConfig = stateManager.getHooksConfigJson(projectPath) ?? {};

  const { commandHookFileMeta, subCommandHookFileMeta } = getHookFileMetas(hooksDirPath, hooksMeta.getHookEvent(), hooksConfig);

  const executionQueue = [commandHookFileMeta, subCommandHookFileMeta];

  if (hooksMeta.getHookEvent().forcePush) {
    // we want to run push related hooks when forcePush flag is enabled
    hooksMeta.setEventCommand('push');
    hooksMeta.setEventSubCommand(undefined);
    const { commandHookFileMeta } = getHookFileMetas(hooksDirPath, hooksMeta.getHookEvent(), hooksConfig);
    executionQueue.push(commandHookFileMeta);
  }

  for (const execFileMeta of executionQueue) {
    if (!execFileMeta) {
      continue;
    }
    const runtime = getRuntime(execFileMeta, hooksConfig);
    if (!runtime) {
      continue;
    }
    await execHelper(runtime, execFileMeta, hooksMeta.getDataParameter(), hooksMeta.getErrorParameter());
  }
};

const execHelper = async (
  runtime: string,
  execFileMeta: HookFileMeta,
  dataParameter: DataParameter,
  errorParameter?: ErrorParameter,
): Promise<void> => {
  if (!execFileMeta?.filePath) {
    return;
  }

  const projectRoot = pathManager.findProjectRoot() ?? process.cwd();
  if (!projectRoot) {
    return;
  }

  printer.blankLine();
  printer.info(`----- 🪝 ${execFileMeta.baseName} execution start -----`);

  try {
    logger.info(`hooks file: ${execFileMeta.fileName} execution started`);
    const childProcess = execa(runtime, [execFileMeta.filePath], {
      cwd: projectRoot,
      env: { PATH: process.env.PATH },
      input: JSON.stringify({
        data: dataParameter,
        error: errorParameter,
      }),
      stripFinalNewline: false,
    });
    childProcess?.stdout?.pipe(process.stdout);
    const childProcessResult = await childProcess;
    if (!childProcessResult?.stdout?.endsWith(EOL)) {
      printer.blankLine();
    }
    logger.info(`hooks file: ${execFileMeta.fileName} execution ended`);
  } catch (err) {
    logger.info(`hooks file: ${execFileMeta.fileName} execution error - ${JSON.stringify(err)}`);
    if (err?.stderr?.length > 0) {
      printer.error(err.stderr);
    }
    if (err?.exitCode) {
      printer.blankLine();
      printer.error(`${execFileMeta.baseName} hook script exited with exit code ${err.exitCode}`);
    }
    printer.blankLine();
    printer.error('exiting Amplify process...');
    printer.blankLine();
    logger.error('hook script exited with error', err);
    // exit code is 76 indicating Amplify exited because user hook script exited with a non zero status
    process.exit(76);
  }
  printer.info(`----- 🪝 ${execFileMeta.baseName} execution end -----`);
  printer.blankLine();
};

const getHookFileMetas = (
  hooksDirPath: string,
  hookEvent: HookEvent,
  hooksConfig: HooksConfig,
): { commandHookFileMeta?: HookFileMeta; subCommandHookFileMeta?: HookFileMeta } => {
  if (!hookEvent.command) {
    return {};
  }
  const extensionsSupported = getSupportedExtensions(hooksConfig);

  const allFiles = fs
    .readdirSync(hooksDirPath)
    .filter(relFilePath => fs.lstatSync(path.join(hooksDirPath, relFilePath)).isFile())
    .map(relFilePath => splitFileName(relFilePath))
    .filter(fileMeta => fileMeta.extension && Object.prototype.hasOwnProperty.call(extensionsSupported, fileMeta.extension))
    .map(fileMeta => ({ ...fileMeta, filePath: path.join(hooksDirPath, String(fileMeta.fileName)) }));

  const commandType = hookEvent.eventPrefix ? [hookEvent.eventPrefix, hookEvent.command].join(hookFileSeparator) : hookEvent.command;
  const commandHooksFiles = allFiles.filter(fileMeta => fileMeta.baseName === commandType);
  const commandHookFileMeta = throwOnDuplicateHooksFiles(commandHooksFiles);

  let subCommandHooksFiles;
  let subCommandHookFileMeta: HookFileMeta | undefined;
  if (hookEvent.subCommand) {
    const subCommandType = hookEvent.eventPrefix
      ? [hookEvent.eventPrefix, hookEvent.command, hookEvent.subCommand].join(hookFileSeparator)
      : [hookEvent.command, hookEvent.subCommand].join(hookFileSeparator);

    subCommandHooksFiles = allFiles.filter(fileMeta => fileMeta.baseName === subCommandType);
    subCommandHookFileMeta = throwOnDuplicateHooksFiles(subCommandHooksFiles);
  }
  return { commandHookFileMeta, subCommandHookFileMeta };
};

const throwOnDuplicateHooksFiles = (files: HookFileMeta[]): HookFileMeta | undefined => {
  if (files.length > 1) {
    throw new Error(`found duplicate hook scripts: ${files.map(file => file.fileName).join(', ')}`);
  } else if (files.length === 1) {
    return files[0];
  }
  return undefined;
};

const splitFileName = (filename: string): HookFileMeta => {
  const lastDotIndex = filename.lastIndexOf('.');
  const fileMeta: HookFileMeta = { fileName: filename, baseName: filename };
  if (lastDotIndex !== -1) {
    fileMeta.baseName = filename.substring(0, lastDotIndex);
    fileMeta.extension = filename.substring(lastDotIndex + 1);
  }
  return fileMeta;
};

const getRuntime = (fileMeta: HookFileMeta, hooksConfig: HooksConfig): string | undefined => {
  const { extension } = fileMeta;
  if (!extension) {
    return undefined;
  }
  const isWin = process.platform === 'win32' || process.env.OSTYPE === 'cygwin' || process.env.OSTYPE === 'msys';
  const extensionObj = getSupportedExtensions(hooksConfig);

  let runtime: string | undefined;
  if (isWin) runtime = extensionObj?.[extension]?.runtime_windows;
  runtime = runtime ?? extensionObj?.[extension]?.runtime;
  if (!runtime) {
    return undefined;
  }

  const executablePath = which.sync(runtime, {
    nothrow: true,
  });
  if (!executablePath) {
    throw new Error(String(`hooks runtime not found: ${runtime}`));
  }

  return executablePath;
};

const getSupportedExtensions = (hooksConfig: HooksConfig): HookExtensions => ({ ...defaultSupportedExt, ...hooksConfig?.extensions });
