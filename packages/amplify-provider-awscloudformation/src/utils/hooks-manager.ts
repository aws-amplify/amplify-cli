import { $TSAny, $TSContext, pathManager, stateManager, PathConstants, HooksConfig, skipHooks } from 'amplify-cli-core';
import * as path from 'path';
import _ from 'lodash';
import ignore from 'ignore';
import { S3 } from '../aws-utils/aws-s3';
import * as aws from 'aws-sdk';
import * as fs from 'fs-extra';
import { sync } from 'glob';
import { ProviderName } from '../constants';
export const S3_HOOKS_DIRECTORY = 'hooks/';
import { fileLogger } from '../utils/aws-logger';
const logger = fileLogger('hooks-manager');

/**
 * uploads all files except ignored files in hooks directory to S3 bucket
 * returns promise that resolves with list of successfully uploaded files
 * return void
 * throws error if upload to S3 fials
 * deletes the previous state of hooks from S3 completely
 *
 * @param {$TSContext} context
 * @returns {Promise<void>} or throws error
 */
export const uploadHooksDirectory = async (context: $TSContext): Promise<void> => {
  if (skipHooks()) {
    return;
  }
  const hooksDirectoryPath = pathManager.getHooksDirPath(context.exeInfo?.localEnvInfo?.projectPath);
  await deleteHooksFromS3(context);

  if (!fs.existsSync(hooksDirectoryPath)) {
    return;
  }

  const relativeFilePathsToUpload = getNonIgnoredFileList(context);
  const s3 = await S3.getInstance(context);

  for (const relativeFilePathToUpload of relativeFilePathsToUpload) {
    const absolutefilePathToUpload = path.join(hooksDirectoryPath, relativeFilePathToUpload);
    if (fs.existsSync(absolutefilePathToUpload)) {
      const s3Params = {
        Body: fs.createReadStream(absolutefilePathToUpload),
        Key: getS3Key(relativeFilePathToUpload),
      };
      await s3.uploadFile(s3Params);
    }
  }
};

/**
 * downloads hooks directory from S3 and places in amplify project.
 * used when no amplify project exist.
 *
 * @param {$TSContext} context
 * @param {{ deploymentArtifacts: string }} backendEnv backendEnv object used to get deploymentBucket
 * @param {aws.S3.ClientConfiguratio} awsConfigInfo aws credentials information to create S3 object
 * @return {Promise<void>}
 */
export const downloadHooks = async (
  context: $TSContext,
  backendEnv: { deploymentArtifacts: string },
  awsConfigInfo: aws.S3.ClientConfiguration,
): Promise<void> => {
  if (skipHooks()) {
    return;
  }
  if (!backendEnv) {
    return;
  }
  const projectPath = process.cwd();
  const hooksDirPath = pathManager.getHooksDirPath(projectPath);

  const s3 = new aws.S3(awsConfigInfo);
  const deploymentBucketName = backendEnv.deploymentArtifacts;

  const params = {
    Prefix: S3_HOOKS_DIRECTORY,
    Bucket: deploymentBucketName,
  };

  const log = logger('downloadHooks.s3.listObjects', [params]);
  let listHookObjects;
  try {
    log();
    listHookObjects = await s3.listObjects(params).promise();
  } catch (ex) {
    log(ex);
    throw ex;
  }

  // loop over each object in S3 hooks directory and download the file
  for (const listHookObject of listHookObjects.Contents) {
    const params = {
      Key: listHookObject.Key,
      Bucket: deploymentBucketName,
    };

    const log = logger('downloadHooks.s3.getObject', [params]);
    let hooksFileObject = null;
    try {
      log();
      hooksFileObject = await s3.getObject(params).promise();
    } catch (ex) {
      log(ex);
      throw ex;
    }
    const hooksFilePath = getHooksFilePathFromS3Key(hooksDirPath, listHookObject.Key);
    placeFile(hooksFilePath, hooksFileObject.Body);
  }
};

/**
 * pulls hooks directory from S3 and places in amplify project.
 * cleans the existing hooks directory.
 *
 * @param {$TSContext} context
 * @return {Promise<void>}
 */
// used by pull-backend
export const pullHooks = async (context: $TSContext): Promise<void> => {
  if (skipHooks()) {
    return;
  }
  const projectDetails = context.amplify.getProjectDetails();
  const envName = context.amplify.getEnvInfo().envName;
  const projectBucket = projectDetails.teamProviderInfo?.[envName]?.[ProviderName]?.DeploymentBucketName;
  const hooksDirPath = pathManager.getHooksDirPath();

  const s3 = await S3.getInstance(context);

  const listHookObjects = await s3.getAllObjectVersions(projectBucket, {
    Prefix: S3_HOOKS_DIRECTORY,
  });

  cleanHooksDirectory(context);

  // loop over each object in S3 hooks directory and download the file
  for (const listHookObject of listHookObjects) {
    let hooksFileData = null;
    hooksFileData = await s3.getFile({
      Key: listHookObject.Key,
    });

    const hooksFilePath = getHooksFilePathFromS3Key(hooksDirPath, listHookObject.Key);
    placeFile(hooksFilePath, hooksFileData);
  }
};

const deleteHooksFromS3 = async (context: $TSContext): Promise<void> => {
  const envName: string = context.amplify?.getEnvInfo()?.envName;
  const projectDetails = context.amplify?.getProjectDetails();
  const projectBucket: string = projectDetails.teamProviderInfo?.[envName]?.[ProviderName]?.DeploymentBucketName;

  if (!envName || !projectDetails || !projectBucket) {
    return;
  }

  const s3 = await S3.getInstance(context);
  await s3.deleteDirectory(projectBucket, S3_HOOKS_DIRECTORY);
};

// hooks utility functions:

/**
 * returns list of relative file paths (no directories) of all files in the hooks directory
 *
 * @param {$TSContext} context
 * @return {string[]} array of relative file paths to hooks directory
 */
const getHooksFilePathList = (context: $TSContext): string[] => {
  const hooksDirectoryPath = pathManager.getHooksDirPath(context.exeInfo?.localEnvInfo?.projectPath);
  const posixHooksDirectoryPath = convertToPosixPath(hooksDirectoryPath);

  return sync(posixHooksDirectoryPath.concat('/**/*'))
    .filter(file => fs.lstatSync(file).isFile())
    .map(file => path.relative(hooksDirectoryPath, file));
};

/**
 * returns list of relative file paths (no directories) of all files in the hooks directory except the ones ignored in hooks-config.json
 *
 * @param {$TSContext} context
 * @return {string[]} array of relative file paths to hooks directory
 */
const getNonIgnoredFileList = (context: $TSContext): string[] => {
  const ig = ignore();
  const configFile: HooksConfig = stateManager.getHooksConfigJson(context.exeInfo?.localEnvInfo?.projectPath) ?? {};
  if (configFile.ignore) {
    ig.add(configFile.ignore);
  }
  return ig.filter(getHooksFilePathList(context));
};

/**
 * returns absolute path to hooks file from s3 key
 *
 * @param {string} hooksDirPath hooks directory path
 * @param {string} s3Key s3 key
 * @return {string} absolute path
 */
const getHooksFilePathFromS3Key = (hooksDirPath: string, s3Key: string): string => {
  if (s3Key.substring(0, S3_HOOKS_DIRECTORY.length) === S3_HOOKS_DIRECTORY) {
    s3Key = s3Key.substring(S3_HOOKS_DIRECTORY.length);
  }

  // s3Key has POSIX seperation, split and join to get OS specific path
  return path.join(hooksDirPath, ...s3Key.split('/'));
};

/**
 * removes all files in hooks directory except ignored files
 *
 * @param {$TSContext} context The number to raise.
 * @return {void}
 */
const cleanHooksDirectory = (context: $TSContext): void => {
  const relativeFilePathsList = getNonIgnoredFileList(context);
  const hooksDirectoryPath = pathManager.getHooksDirPath(context.exeInfo?.localEnvInfo?.projectPath);
  for (const relativeFilePath of relativeFilePathsList) {
    const absolutefilePathToUpload = path.join(hooksDirectoryPath, relativeFilePath);
    if (fs.lstatSync(absolutefilePathToUpload).isFile() && relativeFilePath !== PathConstants.HooksConfigFileName) {
      fs.removeSync(absolutefilePathToUpload);
    }
  }
};

// general utility functions:

const placeFile = (filePath: string, data: $TSAny): void => {
  fs.ensureFileSync(filePath);
  fs.writeFileSync(filePath, data);
};

const convertToPosixPath = (filePath: string): string => {
  return filePath.split(path.sep).join(path.posix.sep);
};

const getS3Key = (relativePath: string): string => {
  return S3_HOOKS_DIRECTORY + convertToPosixPath(relativePath);
};
