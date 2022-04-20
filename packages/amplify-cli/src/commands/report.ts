import {
  stateManager, pathManager, NotInitializedError, $TSContext,
} from 'amplify-cli-core';
import archiver from 'archiver';
import * as fs from 'fs-extra';
import * as path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';
import * as crypto from 'crypto';
import { Redactor, stringMasker } from 'amplify-cli-logger';
import columnify from 'columnify';
import * as _ from 'lodash';
import os from 'os';
import { collectFiles } from './helpers/collect-files';
import { getPublicKey } from './helpers/get-public-key';
import { UsageDataPayload } from '../domain/amplify-usageData/UsageDataPayload';

const report = 'https://5h7ammarg5.execute-api.us-east-1.amazonaws.com/dev/report';

/**
 * Send an error report with redacted project files to Amplify CLI
 * @param context the amplify context object
 * @param error if invoked due to an error
 */
export const run = async (context: $TSContext, error: Error | undefined): Promise<void> => {
  await collectAndSendReport(context, error);
};

const collectAndSendReport = async (context: $TSContext, error: Error | undefined): Promise<void> => {
  const rootPath = pathManager.findProjectRoot();
  if (!rootPath) {
    throw new NotInitializedError();
  }
  const backend = stateManager.getBackendConfig(rootPath);
  const resources : { category: string, resourceName: string, service: string }[] = [];
  const categoryResources = Object.keys(backend)
    .reduce((array, key) => {
      Object.keys(backend[key])
        .forEach(resourceKey => {
          array.push({
            category: key,
            resourceName: resourceKey,
            service: backend[key][resourceKey].service,
          });
        });

      return array;
    }, resources);
  const filePaths = collectFiles(categoryResources, rootPath);
  console.log(filePaths);
  const zipper = archiver.create('zip', {
    encoding: 'utf-8',
  });
  filePaths.forEach(file => {
    zipper.append(file.redact ? Redactor(fs.readFileSync(file.filePath, { encoding: 'utf-8' })) : fs.readFileSync(file.filePath, { encoding: 'utf-8' }), {
      name: path.relative(rootPath, file.filePath),
    });
  });
  if (context.exeInfo && context.exeInfo.cloudformationEvents) {
    const COLUMNS = ['ResourceStatus', 'LogicalResourceId', 'ResourceType', 'Timestamp', 'ResourceStatusReason'];
    const events = context.exeInfo.cloudformationEvents.map(r => ({
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
  const fileDestination = path.join(os.tmpdir(), projectName, `report-${Date.now()}`);
  const output = fs.createWriteStream(path.join(fileDestination, 'example.zip'));
  zipper.pipe(output);
  zipper.finalize();
  const ids = hashedProjectIdentifiers();
  const usageDataPayload : UsageDataPayload = context.usageData.getUsageDataPayload();

  await sendFile(fileDestination, {
    ...ids,
    sessionUuid: usageDataPayload.sessionUuid,
    installationUuid: usageDataPayload.installationUuid,
    amplifyCliVersion: usageDataPayload.amplifyCliVersion,
    nodeVersion: usageDataPayload.nodeVersion,
  });
};

// eslint-disable-next-line spellcheck/spell-checker

const sendFile = async (
  zipPath: string,
  metaData: {
    projectIdentifier: string,
    projectEnvIdentifier: string,
    sessionUuid: string,
    installationUuid: string,
    amplifyCliVersion: string,
    nodeVersion: string,
  },
): Promise<void> => {
  const stream = fs.readFileSync(zipPath);
  const encryptedBuffer = crypto.publicEncrypt(await getPublicKey(), stream);
  const form = new FormData();
  form.append('file', encryptedBuffer, {
    filename: path.basename(zipPath),
  });
  form.append('metadata', JSON.stringify(metaData), {
    contentType: 'application/json',
  });
  await fetch(report, {
    method: 'POST',
    headers: form.getHeaders(),
    body: form,
  }).then(() => {
    // no op
  });
};

const hashedProjectIdentifiers = (): { projectIdentifier: string, projectEnvIdentifier: string } => {
  const projectConfig = stateManager.getProjectConfig();
  const envName = stateManager.getCurrentEnvName();
  const appId = getAppId();
  const projectIdentifier = crypto.createHash('md5').update(`${projectConfig.projectName}-${appId}`).digest('hex');
  const projectEnvIdentifier = crypto.createHash('md5').update(`${projectConfig.projectName}-${appId}-${envName}`).digest('hex');
  return {
    projectIdentifier,
    projectEnvIdentifier,
  };
};

const getAppId = (): string => {
  const meta = stateManager.getMeta();
  return _.get(meta, ['providers', 'awscloudformation', 'AmplifyAppId']);
};
