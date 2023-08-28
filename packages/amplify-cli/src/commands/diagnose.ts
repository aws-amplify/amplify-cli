import { stateManager, pathManager, spinner, DiagnoseReportUploadError, projectNotInitializedError } from '@aws-amplify/amplify-cli-core';
import archiver from 'archiver';
import * as fs from 'fs-extra';
import * as path from 'path';
import fetch from 'node-fetch';
import { Redactor, stringMasker } from '@aws-amplify/amplify-cli-logger';
import columnify from 'columnify';
import * as _ from 'lodash';
import os from 'os';
import { v4 } from 'uuid';
import { prompter, printer } from '@aws-amplify/amplify-prompts';
import { collectFiles } from './helpers/collect-files';
import { encryptBuffer, encryptKey, createHashedIdentifier } from './helpers/encryption-helpers';
import { UsageDataPayload } from '../domain/amplify-usageData/UsageDataPayload';
import { DebugConfig } from '../app-config/debug-config';
import { isHeadlessCommand } from '../utils/headless-input-utils';
import { Context } from '../domain/context';
import { reporterEndpoint } from './helpers/reporter-apis';

/**
 * Prompts if there is a failure in the CLI
 * @param context amplify cli context object
 * @param error optional error to be reported
 */
export const reportError = async (context: Context, error: Error | undefined): Promise<void> => {
  let sendReport: boolean;
  // if no root path don't do anything
  const rootPath = pathManager.findProjectRoot();
  if (!rootPath) {
    return;
  }
  const isHeadless = isHeadlessCommand(context) || _.get(context, ['input', 'options', 'yes'], false);

  // if it's headless or already has been prompted earlier don't prompt just check the config
  if (!isHeadless && DebugConfig.Instance.promptSendReport()) {
    sendReport = await prompter.yesOrNo(
      'An unexpected error has occurred, opt in to send an error report to AWS Amplify with non-sensitive project configuration files. Confirm ',
      false,
    );
    if (sendReport) {
      showLearnMore(true);
    }
    if (!isHeadless) {
      DebugConfig.Instance.setAndWriteShareProject(sendReport);
    }
  } else {
    sendReport = DebugConfig.Instance.getCanSendReport();
  }
  if (sendReport) {
    await zipSend(context, true, error);
  }
};

/**
 * Send an error report with redacted project files to Amplify CLI
 * @param context the amplify context object
 * @param error if invoked due to an error
 */
export const run = async (context: Context, error: Error | undefined = undefined): Promise<void> => {
  const skipPrompts = _.get(context, ['input', 'options', 'send-report'], false);
  const turnOff = _.get(context, ['input', 'options', 'auto-send-off'], false);
  const turnOn = _.get(context, ['input', 'options', 'auto-send-on'], false);
  if (turnOff) {
    DebugConfig.Instance.setAndWriteShareProject(false);
    return;
  }

  if (turnOn) {
    DebugConfig.Instance.setAndWriteShareProject(true);
    return;
  }
  showLearnMore(false);
  await zipSend(context, skipPrompts, error);
};

const showLearnMore = (showOptOut: boolean): void => {
  printer.blankLine();
  printer.info('Learn more at https://docs.amplify.aws/cli/reference/diagnose/');
  if (showOptOut) {
    printer.blankLine();
    printer.info(
      "This project has been opted in automatically to share non-sensitive project configuration files. you can opt out by running 'amplify diagnose --auto-send-off'",
    );
  }
};

const zipSend = async (context: Context, skipPrompts: boolean, error: Error | undefined): Promise<void> => {
  const choices = ['Generate report', 'Nothing'];
  if (!skipPrompts) {
    const diagnoseAction = await prompter.pick('What would you like to do?', choices);
    if (diagnoseAction !== choices[0]) {
      return;
    }
  }
  try {
    spinner.start('Creating Zip');
    const fileDestination = await createZip(context, error);
    spinner.stop();
    printer.blankLine();
    printer.success(`Report saved: ${fileDestination}`);
    printer.blankLine();
    let canSendReport = true;
    if (!skipPrompts) {
      canSendReport = await prompter.yesOrNo('Send Report', false);
    }
    if (canSendReport) {
      spinner.start('Sending zip');
      const projectId = await sendReport(context, fileDestination);
      spinner.succeed('Done');
      printer.blankLine();
      printer.info(`Project Identifier: ${projectId}`);
      printer.blankLine();
    }
  } catch (ex) {
    printer.blankLine();
    printer.info(ex.message);
    void context.usageData.emitError(ex);
    spinner.fail();
  }
};

const createZip = async (context: Context, error: Error | undefined): Promise<string> => {
  const rootPath = pathManager.findProjectRoot();
  if (!rootPath) {
    throw projectNotInitializedError();
  }
  const backend = stateManager.getBackendConfig(rootPath);
  const resources: { category: string; resourceName: string; service: string }[] = [];
  const categoryResources = Object.keys(backend).reduce((array, key) => {
    Object.keys(backend[key]).forEach((resourceKey) => {
      array.push({
        category: key,
        resourceName: resourceKey,
        service: backend[key][resourceKey].service,
      });
    });

    return array;
  }, resources);
  const filePaths = collectFiles(categoryResources, rootPath);
  const zipper = archiver.create('zip');
  filePaths.forEach((file) => {
    zipper.append(
      file.redact ? Redactor(fs.readFileSync(file.filePath, { encoding: 'utf-8' })) : fs.readFileSync(file.filePath, { encoding: 'utf-8' }),
      {
        name: path.relative(rootPath, file.filePath),
      },
    );
  });
  if (context.exeInfo && context.exeInfo.cloudformationEvents) {
    const COLUMNS = ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'];
    const events = context.exeInfo.cloudformationEvents.map((r) => ({
      ...r,
      LogicalResourceId: stringMasker(r.LogicalResourceId),
    }));
    const cloudformation = columnify(events, {
      columns: COLUMNS,
      showHeaders: false,
    });
    zipper.append(cloudformation, {
      name: 'cloudformation_log.txt',
    });
  }

  if (error) {
    zipper.append(JSON.stringify(error, null, 4), {
      name: 'error.json',
    });
  }
  const { projectName } = stateManager.getProjectConfig();

  // eslint-disable-next-line spellcheck/spell-checker
  const fileDestination = path.join(os.tmpdir(), projectName, `report-${Date.now()}.zip`);
  fs.ensureFileSync(fileDestination);
  const output = fs.createWriteStream(fileDestination);
  zipper.pipe(output);
  await zipper.finalize();

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(fileDestination));
    output.on('error', (err) => {
      reject(err);
    });
  });
};

const sendReport = async (context: Context, fileDestination): Promise<string> => {
  const ids = hashedProjectIdentifiers();
  const usageDataPayload: UsageDataPayload = context.usageData.getUsageDataPayload(null, '');

  await sendFile(fileDestination, {
    ...ids,
    sessionUuid: usageDataPayload.sessionUuid,
    installationUuid: usageDataPayload.installationUuid,
    amplifyCliVersion: usageDataPayload.amplifyCliVersion,
    nodeVersion: usageDataPayload.nodeVersion,
  });
  return ids.projectEnvIdentifier;
};

// eslint-disable-next-line spellcheck/spell-checker

const sendFile = async (
  zipPath: string,
  metaData: {
    projectIdentifier: string;
    projectEnvIdentifier: string;
    sessionUuid: string;
    installationUuid: string;
    amplifyCliVersion: string;
    nodeVersion: string;
  },
): Promise<void> => {
  const report = reporterEndpoint();
  const stream = fs.readFileSync(zipPath);
  const passKey = v4();
  const cipherTextBlob = await encryptBuffer(stream, passKey);
  const key = await encryptKey(passKey);
  const data = JSON.stringify({ ...metaData, key, encryptedFile: cipherTextBlob });
  const response = await fetch(report, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': data.length.toString(),
    },
    body: data,
  });
  if (response.status !== 200) {
    throw new DiagnoseReportUploadError(response.statusText);
  }
};

const hashedProjectIdentifiers = (): { projectIdentifier: string; projectEnvIdentifier: string } => {
  const projectConfig = stateManager.getProjectConfig();
  const envName = stateManager.getCurrentEnvName();
  const appId = getAppId();
  return createHashedIdentifier(projectConfig.projectName, appId, envName);
};

const getAppId = (): string => {
  const meta = stateManager.getMeta();
  return _.get(meta, ['providers', 'awscloudformation', 'AmplifyAppId']);
};
