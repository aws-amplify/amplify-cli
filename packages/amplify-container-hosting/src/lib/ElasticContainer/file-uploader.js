const fs = require('fs-extra');
const mime = require('mime-types');
const constants = require('../constants');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

export async function getS3Client(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[constants.providerName]);
  const config = await provider.getConfiguredAWSClientConfig(context, constants.CategoryName, action);
  return new S3Client(config);
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

  const upload = new Upload({
    client: s3Client,
    params: uploadParams,
  });

  const data = await upload.done();

  return data;
}
