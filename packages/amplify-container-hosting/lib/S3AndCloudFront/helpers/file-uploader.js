const fs = require('fs-extra');
const path = require('path');
const Ora = require('ora');
const mime = require('mime-types');
const sequential = require('promise-sequential');
const fileScanner = require('./file-scanner');
const constants = require('../../constants');

const category = 'hosting';
const serviceName = 'S3AndCloudFront';
const providerName = 'awscloudformation';

async function run(context, distributionDirPath) {
  const { WebsiteConfiguration } = context.exeInfo.template.Resources.S3Bucket.Properties;
  const { output } = context.exeInfo.amplifyMeta[category][serviceName];
  const fileList = fileScanner.scan(context, distributionDirPath, WebsiteConfiguration);

  const uploadFileTasks = [];
  const s3Client = await getS3Client(context, 'update');
  const hostingBucketName = getHostingBucketName(context);

  let cloudFrontS3CanonicalUserId;
  if (context.exeInfo.template.Resources.OriginAccessIdentity && output.CloudFrontOriginAccessIdentity) {
    const cloudFrontClient = await getCloudFrontClient(context, 'retrieve');
    const params = { Id: output.CloudFrontOriginAccessIdentity };
    const originAccessIdentity = await cloudFrontClient.getCloudFrontOriginAccessIdentity(params).promise();
    cloudFrontS3CanonicalUserId = originAccessIdentity.S3CanonicalUserId;
  }

  fileList.forEach(filePath => {
    uploadFileTasks.push(() => uploadFile(s3Client, hostingBucketName, distributionDirPath, filePath, cloudFrontS3CanonicalUserId));
  });

  const spinner = new Ora('Uploading files...');
  try {
    spinner.start();
    await sequential(uploadFileTasks);
    spinner.succeed('Uploaded files successfully.');
  } catch (e) {
    spinner.fail('Error has occurred during file upload.');
    throw e;
  }
}

async function getS3Client(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  const aws = await provider.getConfiguredAWSClient(context, constants.CategoryName, action);
  return new aws.S3();
}

async function getCloudFrontClient(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  const aws = await provider.getConfiguredAWSClient(context, constants.CategoryName, action);
  return new aws.CloudFront();
}

function getHostingBucketName(context) {
  const { amplifyMeta } = context.exeInfo;
  return amplifyMeta[constants.CategoryName][serviceName].output.HostingBucketName;
}

async function uploadFile(s3Client, hostingBucketName, distributionDirPath, filePath, cloudFrontS3CanonicalUserId) {
  let relativeFilePath = path.relative(distributionDirPath, filePath);
  // make Windows-style relative paths compatible to S3
  relativeFilePath = relativeFilePath.replace(/\\/g, '/');

  const fileStream = fs.createReadStream(filePath);
  const contentType = mime.lookup(relativeFilePath);
  const uploadParams = {
    Bucket: hostingBucketName,
    Key: relativeFilePath,
    Body: fileStream,
    ContentType: contentType || 'text/plain',
  };

  if (cloudFrontS3CanonicalUserId) {
    uploadParams.GrantRead = `id=${cloudFrontS3CanonicalUserId}`;
  } else {
    uploadParams.ACL = 'public-read';
  }

  const data = await s3Client.upload(uploadParams).promise();

  return data;
}

module.exports = {
  run,
};
