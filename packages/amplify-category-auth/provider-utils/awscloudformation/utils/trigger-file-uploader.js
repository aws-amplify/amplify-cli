
const { readdirSync, existsSync } = require('fs');
const { createReadStream } = require('fs-extra');
const Ora = require('ora');
const mime = require('mime-types');
const sequential = require('promise-sequential');

const providerName = 'awscloudformation';

async function getS3Client(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  const aws = await provider.getConfiguredAWSClient(context, 'auth', action);
  return new aws.S3();
}

async function uploadFiles(context) {
  try {
    const s3Client = await getS3Client(context, 'update');
    const authResource = Object.keys(context.amplify.getProjectMeta().auth)[0];
    const authPath = `${context.amplify.pathManager.getAmplifyDirPath()}/backend/auth/${authResource}`;
    if (!authPath) {
      return null;
    }
    const assetPath = `${authPath}/assets`;
    const env = context.amplify.getEnvInfo().envName;
    const bucketName = `${context.amplify.readJsonFile(`${authPath}/parameters.json`).verificationBucketName}-${env}`;

    if (!existsSync(assetPath)) {
      return null;
    }
    const fileList = readdirSync(assetPath);
    const uploadFileTasks = [];
    fileList.forEach((file) => {
      uploadFileTasks.push(async () =>
        await uploadFile(s3Client, bucketName, `${assetPath}/${file}`, file));
    });

    const spinner = new Ora('Uploading files...');
    try {
      spinner.start();
      await sequential(uploadFileTasks);
      spinner.succeed('Uploaded files successfully.');
    } catch (e) {
      spinner.fail('Error has occured during file upload.');
      throw e;
    }
  } catch (e) {
    throw new Error('Unable to upload trigger files to S3');
  }
}

async function uploadFile(s3Client, hostingBucketName, filePath, file) {
  const fileStream = createReadStream(filePath);
  const contentType = mime.lookup(filePath);
  const uploadParams = {
    Bucket: hostingBucketName,
    Key: file,
    Body: fileStream,
    ContentType: contentType || 'text/plain',
    ACL: 'public-read',
  };

  const data = await s3Client.upload(uploadParams).promise()
    .catch((e) => {
      console.log('e', e);
    });

  return data;
}

module.exports = {
  uploadFiles,
};
