import { $TSContext, FeatureFlags, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import * as path from 'path';
import _ from 'lodash';
import ignore from 'ignore';
import { S3 } from '../aws-utils/aws-s3';
import fs from 'fs-extra';

export async function uploadHooksDirectory(context: $TSContext): Promise<string[]> {
  // resolves with list of successfully uploaded files
  // rejects with error with upload fails
  // deletes the previous state of hooks from S3 completely

  return new Promise(async (resolve, reject) => {
    const hooksDirectoryPath = pathManager.getHooksDirPath(context.exeInfo.localEnvInfo.projectPath);
    // TODO: delete s3 hooks direcotry
    try {
      if (!fs.existsSync(hooksDirectoryPath)) {
        resolve([]);
      }
    } catch (e) {
      resolve([]);
    }
    const relativeFilePathsToUpload = getNonIgnoredFileList(context);
    const filesSuccessfullyUploaded = [];
    const s3 = await S3.getInstance(context);
    for (let relativeFilePathToUpload of relativeFilePathsToUpload) {
      const absolutefilePathToUpload = path.join(hooksDirectoryPath, relativeFilePathToUpload);
      if (fs.existsSync(absolutefilePathToUpload)) {
        const s3Params = {
          Body: fs.createReadStream(absolutefilePathToUpload),
          Key: getS3UploadPath(relativeFilePathToUpload),
        };
        // TODO: logger?
        // const log = logger('uploadFile.s3.uploadFile', [{ Key: key }]);
        try {
          // TODO: log ?
          // log();
          await s3.uploadFile(s3Params);
          filesSuccessfullyUploaded.push(relativeFilePathToUpload);
        } catch (ex) {
          // TODO: log ?
          // log(ex);
          reject(ex);
        }
      }
    }
    resolve(filesSuccessfullyUploaded);
  });
}

export async function deleteS3HooksDirectory() {
  console.log('here');
}

function getHooksFilePathList(context: $TSContext): string[] {
  // returns list of relative file paths of all files in the hooks directory
  const hooksDirectoryPath = pathManager.getHooksDirPath(context.exeInfo.localEnvInfo.projectPath);
  return fs.readdirSync(hooksDirectoryPath);
}

function getNonIgnoredFileList(context: $TSContext): string[] {
  // returns list of relative file paths of all files in the hooks directory except the ones ignored in hooks-config.json
  const ig = ignore();
  const hooksDirectoryPath = pathManager.getHooksDirPath(context.exeInfo.localEnvInfo.projectPath);
  const configFile = stateManager.getHooksConfigJson(context.exeInfo.localEnvInfo.projectPath);
  // TODO: test ignore on push
  if (typeof configFile === 'object' && configFile !== null && configFile.hasOwnProperty('ignore') && Array.isArray(configFile.ignore)) {
    configFile.ignore = configFile.ignore.filter(listItem => typeof listItem === 'string' || listItem instanceof String);
    ig.add(configFile.ignore);
  }
  const filePathList = getHooksFilePathList(context);
  return ig.filter(filePathList);
}

function getS3UploadPath(relativePath: string): string {
  return 'hooks/' + relativePath.split(path.sep).join(path.posix.sep);
}
