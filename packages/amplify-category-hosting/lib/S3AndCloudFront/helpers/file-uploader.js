const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');
const sequential = require('promise-sequential');
const fileScanner = require('./file-scanner');
const constants = require('../../constants');

const serviceName = 'S3AndCloudFront';
const providerName = 'awscloudformation';

async function run(context, distributionDirPath) {
  const s3Client = await getS3Client(context, 'update');
  const hostingBucketName = getHostingBucketName(context);

  const fileList =
    fileScanner.scan(context, distributionDirPath);

  const uploadFileTasks = [];

  fileList.forEach((filePath) => {
    uploadFileTasks.push(() =>
      uploadFile(s3Client, hostingBucketName, distributionDirPath, filePath));
  });

  return sequential(uploadFileTasks);
}

async function getS3Client(context, action) {
  const { projectConfig } = context.exeInfo;
  const provider = require(projectConfig.providers[providerName]);
  const aws = await provider.getConfiguredAWSClient(context, constants.CategoryName, action);
  return new aws.S3();
}

function getHostingBucketName(context) {
  const { amplifyMeta } = context.exeInfo;
  return amplifyMeta[constants.CategoryName][serviceName].output.HostingBucketName;
}

function uploadFile(s3Client, hostingBucketName, distributionDirPath, filePath) {
  return new Promise((resolve, reject) => {
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

    s3Client.upload(uploadParams, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports = {
  run,
};
