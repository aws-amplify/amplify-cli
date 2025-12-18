const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const awsS3Client = new S3Client();
const bucketEnvVar = '{{bucketEnvVar}}'; // This value is replaced from test

exports.handler = async () => {
  const command = new ListObjectsV2Command({
    Bucket: process.env[bucketEnvVar],
  });

  const listObjects = await awsS3Client.send(command);

  return listObjects;
};
