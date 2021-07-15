import { $TSAny, $TSContext, pathManager, stateManager } from 'amplify-cli-core';
import * as path from 'path';
import _ from 'lodash';
import ignore from 'ignore';
import { S3 } from '../aws-utils/aws-s3';
import * as aws from 'aws-sdk';
import fs from 'fs-extra';

const S3_HOOKS_DIRECTORY = 'hooks/';

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
  return S3_HOOKS_DIRECTORY + relativePath.split(path.sep).join(path.posix.sep);
}

export async function downloadHooks(context: $TSContext, backendEnv: $TSAny, awsConfigInfo: $TSAny) {
  if (!backendEnv) {
    return;
  }
  const projectPath = process.cwd();
  const hooksDirPath = pathManager.getHooksDirPath(projectPath);

  const s3Client = new aws.S3(awsConfigInfo);
  const deploymentBucketName = backendEnv.deploymentArtifacts;

  const params = {
    Prefix: S3_HOOKS_DIRECTORY,
    Bucket: deploymentBucketName,
  };

  // TODO: logs
  //   const log = logger("downloadHooks.s3.listObjects", [params]);
  let listHookObjects;
  try {
    // log();
    listHookObjects = await s3Client.listObjects(params).promise();
  } catch (ex) {
    // log(ex);
    return;
  }

  // loop over each object in S3 hooks directory and download the file
  for (let listHookObject of listHookObjects.Contents) {
    const params = {
      Key: listHookObject.Key,
      Bucket: deploymentBucketName,
    };
    // TODO: logs
    // const log = logger('downloadHooks.s3.getObject', [params]);
    let hooksFileObject = null;
    try {
      // log();
      hooksFileObject = await s3Client.getObject(params).promise();
    } catch (ex) {
      // log(ex);
    }
    try {
      let relativeFilePath: string = listHookObject.Key;
      if (relativeFilePath.substring(0, S3_HOOKS_DIRECTORY.length).localeCompare(S3_HOOKS_DIRECTORY) === 0) {
        relativeFilePath = relativeFilePath.substring(S3_HOOKS_DIRECTORY.length);
      }
      // relativeFilePath has POSIX seperation, split and join to get OS specific path
      const hooksFilePath = path.join(hooksDirPath, ...relativeFilePath.split('/'));
      fs.ensureFileSync(hooksFilePath);
      fs.writeFileSync(hooksFilePath, hooksFileObject.Body);
    } catch (ex) {}
  }
}
