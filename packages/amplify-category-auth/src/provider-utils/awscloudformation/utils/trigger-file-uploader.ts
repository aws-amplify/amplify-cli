import { $TSContext, pathManager, stateManager, AmplifyCategories, spinner, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import type { S3 } from 'aws-sdk';
import { createReadStream, readdirSync, existsSync } from 'fs-extra';
import mime from 'mime-types';
import * as path from 'path';
import { getAuthResourceName } from '../../../utils/getAuthResourceName';
import AWS from 'aws-sdk';

const providerName = 'awscloudformation';

const getS3Client = async (context: $TSContext, action: string): Promise<S3> => {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = await import(providerPlugins[providerName]);
  const config = await provider.getConfiguredAWSClient(context, AmplifyCategories.AUTH, action);
  return new AWS.S3(config);
};

/**
 * upload code and assets needed for function triggers
 */
export const uploadFiles = async (context: $TSContext): Promise<void> => {
  try {
    const s3Client = await getS3Client(context, 'update');
    const authResource = await getAuthResourceName(context);
    const authPath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.AUTH, authResource);
    if (!authPath) {
      return;
    }
    const assetPath = path.join(authPath, 'assets');
    const env = context.amplify.getEnvInfo().envName;

    const authParams = stateManager.getResourceParametersJson(undefined, AmplifyCategories.AUTH, authResource);
    const bucketName = `${authParams.verificationBucketName}-${env}`;

    if (!existsSync(assetPath)) {
      return;
    }
    const fileList = readdirSync(assetPath);
    const uploadFileTasks: (() => Promise<S3.ManagedUpload.SendData>)[] = [];
    fileList.forEach((file) => {
      uploadFileTasks.push(async () => uploadFile(s3Client, bucketName, path.join(assetPath, file), file));
    });

    try {
      spinner.start('Uploading files.');
      await Promise.all(uploadFileTasks);
      spinner.succeed('Uploaded files successfully.');
    } catch (e) {
      spinner.fail('Error has occurred during file upload.');
      throw e;
    }
  } catch (e) {
    throw new AmplifyFault('TriggerUploadFault', { message: 'Unable to upload trigger files to S3' }, e);
  }
};

const uploadFile = async (s3Client: S3, hostingBucketName: string, filePath: string, file: string): Promise<S3.ManagedUpload.SendData> => {
  const fileStream = createReadStream(filePath);
  const contentType = mime.lookup(filePath);
  const uploadParams = {
    Bucket: hostingBucketName,
    Key: file,
    Body: fileStream,
    ContentType: contentType || 'text/plain',
    ACL: 'public-read',
  };

  return s3Client.upload(uploadParams).promise();
};
