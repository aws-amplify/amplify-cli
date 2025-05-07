const Ora = require('ora');
const sequential = require('promise-sequential');
const fileScanner = require('./file-scanner');
const constants = require('../../constants');
const { uploadFile } = require('./upload-file');
const AWS = require('aws-sdk');

const serviceName = 'S3AndCloudFront';
const providerName = 'awscloudformation';

async function run(context, distributionDirPath) {
  const { WebsiteConfiguration } = context.exeInfo.template.Resources.S3Bucket.Properties;
  const fileList = fileScanner.scan(context, distributionDirPath, WebsiteConfiguration);

  const s3Client = await getS3Client(context, 'update');
  const hostingBucketName = getHostingBucketName(context);

  const hasCloudFront = !!context?.exeInfo?.template?.Resources?.CloudFrontDistribution;

  const uploadFileTasks = sortUploadFiles(fileList).map(
    (filePath) => () => uploadFile(s3Client, hostingBucketName, distributionDirPath, filePath, hasCloudFront),
  );

  const spinner = new Ora('Uploading files.');
  try {
    spinner.start();
    await sequential(uploadFileTasks);
    spinner.succeed('Uploaded files successfully.');
  } catch (e) {
    spinner.fail('Error has occurred during file upload.');
    throw e;
  }
}

function sortUploadFiles(fileList) {
  const filesToUploadLast = 'index.html';
  const sortFiles = (fileA, fileB) => (fileA.includes(filesToUploadLast) ? 1 : fileB.includes(filesToUploadLast) ? -1 : 0);

  return fileList.sort(sortFiles);
}

async function getS3Client(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  const config = await provider.getConfiguredAWSClient(context, constants.CategoryName, action);
  return new AWS.S3(config);
}

function getHostingBucketName(context) {
  const { amplifyMeta } = context.exeInfo;
  return amplifyMeta[constants.CategoryName][serviceName].output.HostingBucketName;
}

module.exports = {
  run,
};
