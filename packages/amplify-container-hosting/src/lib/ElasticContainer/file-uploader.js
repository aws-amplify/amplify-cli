const fs = require('fs-extra');
const mime = require('mime-types');
const constants = require('../constants');
const S3 = require('aws-sdk/clients/s3');

export async function getS3Client(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[constants.providerName]);
  const config = await provider.getConfiguredAWSClient(context, constants.CategoryName, action);
  return new S3(config);
}

export async function uploadFile(s3Client, bucketName, filePath, fileKey) {
  const fileStream = fs.createReadStream(filePath);
  const contentType = mime.lookup(filePath);
  const uploadParams = {
    Bucket: bucketName,
    Key: fileKey,
    Body: fileStream,
    ContentType: contentType || 'text/plain',
  };

  const data = await s3Client.upload(uploadParams).promise();

  return data;
}
