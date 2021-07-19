import { $TSAny, $TSContext, pathManager, stateManager, PathConstants } from 'amplify-cli-core';
import * as path from 'path';
import _ from 'lodash';
import ignore from 'ignore';
import { S3 } from '../aws-utils/aws-s3';
import * as aws from 'aws-sdk';
import fs from 'fs-extra';
import { sync } from 'glob';
import { ProviderName } from '../constants';
const S3_HOOKS_DIRECTORY = 'hooks/';

export async function uploadHooksDirectory(context: $TSContext): Promise<string[]> {
  /**
   * uploads all files except ignored files in hooks directory to S3 bucket
   * returns promise that resolves with list of successfully uploaded files
   * return empty array if hooks directory doesnt exist
   * throws error if upload to S3 fials
   * deletes the previous state of hooks from S3 completely
   *
   * @param {$TSContext} context
   * @returns {Promise<string[]>} or throws error
   */

  const hooksDirectoryPath = pathManager.getHooksDirPath(context.exeInfo.localEnvInfo.projectPath);
  await deleteHooksFromS3(context);

  if (!fs.existsSync(hooksDirectoryPath)) {
    return [];
  }

  const relativeFilePathsToUpload = getNonIgnoredFileList(context);
  const filesSuccessfullyUploaded = [];
  const s3 = await S3.getInstance(context);

  for (const relativeFilePathToUpload of relativeFilePathsToUpload) {
    const absolutefilePathToUpload = path.join(hooksDirectoryPath, relativeFilePathToUpload);
    if (fs.existsSync(absolutefilePathToUpload)) {
      const s3Params = {
        Body: fs.createReadStream(absolutefilePathToUpload),
        Key: getS3Key(relativeFilePathToUpload),
      };
      try {
        await s3.uploadFile(s3Params);
        filesSuccessfullyUploaded.push(relativeFilePathToUpload);
      } catch (ex) {
        throw ex;
      }
    }
  }
  return filesSuccessfullyUploaded;
}

export async function downloadHooks(
  context: $TSContext,
  backendEnv: { deploymentArtifacts: string },
  awsConfigInfo: aws.S3.ClientConfiguration,
): Promise<void> {
  /**
   * downloads hooks directory from S3 and places in amplify project.
   * used when no amplify project exist.
   *
   * @param {$TSContext} context
   * @param {{ deploymentArtifacts: string }} backendEnv backendEnv object used to get deploymentBucket
   * @param {aws.S3.ClientConfiguratio} awsConfigInfo aws credentials information to create S3 object
   * @return {Promise<void>}
   */
  // used by attach-backend
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
  for (const listHookObject of listHookObjects.Contents) {
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
    const hooksFilePath = getHooksFilePathFromS3Key(hooksDirPath, listHookObject.Key);
    placeFile(hooksFilePath, hooksFileObject.Body);
  }
}

export async function pullHooks(context: $TSContext): Promise<void> {
  /**
   * pulls hooks directory from S3 and places in amplify project.
   * cleans the existing hooks directory
   *
   * @param {$TSContext} context
   * @return {Promise<void>}
   */
  // used by pull-backend
  const amplifyDir = context.amplify.pathManager.getAmplifyDirPath();
  const hooksDirPath = pathManager.getHooksDirPath();

  const s3 = await S3.getInstance(context);
  // const file = await downloadZip(s3, tempDir, S3BackendZipFileName);

  const listHookObjects = await s3.getObjects({
    Prefix: S3_HOOKS_DIRECTORY,
  });

  cleanHooksDirectory(context);

  // loop over each object in S3 hooks directory and download the file
  for (const listHookObject of listHookObjects) {
    let hooksFileData = null;
    try {
      // log();
      hooksFileData = await s3.getFile({
        Key: listHookObject.Key,
      });
    } catch (ex) {}

    const hooksFilePath = getHooksFilePathFromS3Key(hooksDirPath, listHookObject.Key);
    placeFile(hooksFilePath, hooksFileData);
  }
}

export async function deleteHooksFromS3(context: $TSContext): Promise<void> {
  const envName = context.amplify.getEnvInfo().envName;
  const projectDetails = context.amplify.getProjectDetails();
  const projectBucket = projectDetails.teamProviderInfo[envName][ProviderName].DeploymentBucketName;

  const s3 = await S3.getInstance(context);
  try {
    await s3.deleteDirectory(projectBucket, S3_HOOKS_DIRECTORY);
  } catch (ex) {
    throw ex;
  }
}
// hooks utility functions:
function getHooksFilePathList(context: $TSContext): string[] {
  /**
   * returns list of relative file paths (no directories) of all files in the hooks directory
   *
   * @param {$TSContext} context
   * @return {string[]} array of relative file paths to hooks directory
   */

  const hooksDirectoryPath = pathManager.getHooksDirPath(context.exeInfo.localEnvInfo.projectPath);
  const posixHooksDirectoryPath = convertToPosixPath(hooksDirectoryPath);

  return sync(posixHooksDirectoryPath.concat('/**/*'))
    .filter(file => fs.lstatSync(file).isFile())
    .map(file => path.relative(hooksDirectoryPath, file));
}

function getNonIgnoredFileList(context: $TSContext): string[] {
  /**
   * returns list of relative file paths (no directories) of all files in the hooks directory except the ones ignored in hooks-config.json
   *
   * @param {$TSContext} context
   * @return {string[]} array of relative file paths to hooks directory
   */
  //

  const ig = ignore();
  const configFile = stateManager.getHooksConfigJson(context.exeInfo.localEnvInfo.projectPath);

  if (typeof configFile === 'object' && configFile !== null && configFile.hasOwnProperty('ignore') && Array.isArray(configFile.ignore)) {
    configFile.ignore = configFile.ignore.filter(listItem => typeof listItem === 'string' || listItem instanceof String);
    ig.add(configFile.ignore);
  }

  return ig.filter(getHooksFilePathList(context));
}

function getHooksFilePathFromS3Key(hooksDirPath: string, s3Key: string): string {
  /**
   * returns absolute path to hooks file from s3 key
   *
   * @param {string} hooksDirPath hooks directory path
   * @param {string} s3Key s3 key
   * @return {string} absolute path
   */

  if (s3Key.substring(0, S3_HOOKS_DIRECTORY.length).localeCompare(S3_HOOKS_DIRECTORY) === 0) {
    s3Key = s3Key.substring(S3_HOOKS_DIRECTORY.length);
  }

  // s3Key has POSIX seperation, split and join to get OS specific path
  return path.join(hooksDirPath, ...s3Key.split('/'));
}

function cleanHooksDirectory(context: $TSContext): void {
  /**
   * removes all files in hooks directory except ignored files
   *
   * @param {$TSContext} context The number to raise.
   * @return {void}
   */

  const relativeFilePathsList = getNonIgnoredFileList(context);
  const hooksDirectoryPath = pathManager.getHooksDirPath(context.exeInfo.localEnvInfo.projectPath);
  for (const relativeFilePath of relativeFilePathsList) {
    const absolutefilePathToUpload = path.join(hooksDirectoryPath, relativeFilePath);
    if (fs.lstatSync(absolutefilePathToUpload).isFile() && relativeFilePath.localeCompare(PathConstants.HooksConfigFileName) !== 0) {
      fs.removeSync(absolutefilePathToUpload);
    }
  }
}

// general utility functions:
function placeFile(filePath: string, data: $TSAny): void {
  /**
   * quietly ensures a file esists else creates one and writes the data
   *
   * @param {string} filePath path to file
   * @param {$TSAny} data data to be placed in the file
   * @return {void}
   */
  try {
    fs.ensureFileSync(filePath);
    fs.writeFileSync(filePath, data);
  } catch (ex) {}
}

function convertToPosixPath(filePath: string): string {
  /**
   * Returns POSIX path.
   *
   * @param {string} filePath any file path
   * @return {string} posixFilePath
   */

  return filePath.split(path.sep).join(path.posix.sep);
}

function getS3Key(relativePath: string): string {
  /**
   * Returns S3 key to hooks files
   *
   * @param {string} relativePath relative path to hooks directory
   * @return {string} S3 key to hooks files
   */

  return S3_HOOKS_DIRECTORY + convertToPosixPath(relativePath);
}
