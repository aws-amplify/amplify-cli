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
const systemParams = [
  'ContentType',
  'CacheControl',
  'ContentDisposition',
  'ContentEncoding',
  'ContentLanguage',
  'Expires',
  'WebsiteRedirectLocation',
];

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

  fileList.forEach(file => {
    uploadFileTasks.push(() =>
      uploadFile(s3Client, hostingBucketName, distributionDirPath, file.filePath, file.meta, cloudFrontS3CanonicalUserId),
    );
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
const convertArrayToObject = (array, key, value) =>
  array.reduce(
    (obj, item) => ({
      ...obj,
      [item[key]]: item[value],
    }),
    {},
  );
async function uploadFile(s3Client, hostingBucketName, distributionDirPath, filePath, fileMeta, cloudFrontS3CanonicalUserId) {
  let relativeFilePath = path.relative(distributionDirPath, filePath);
  // make Windows-style relative paths compatible to S3
  relativeFilePath = relativeFilePath.replace(/\\/g, '/');

  const fileStream = fs.createReadStream(filePath);
  const contentType = mime.lookup(relativeFilePath);
  let metaData = {};
  let systemMetaData = {};
  if (fileMeta && fileMeta.length > 0) {
    const metaDataList = convertArrayToObject(
      fileMeta.filter(x => !systemParams.includes(x.key)),
      'key',
      'value',
    );
    const systemMetaDataList = convertArrayToObject(
      fileMeta.filter(x => systemParams.includes(x.key)),
      'key',
      'value',
    );
    metaData = { Metadata: { ...metaDataList } };
    systemMetaData = { ...systemMetaDataList };
  }
  const uploadParams = {
    Bucket: hostingBucketName,
    Key: relativeFilePath,
    Body: fileStream,
    ContentType: contentType || 'text/plain',
    ...metaData,
    ...systemMetaData,
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
