const AWS = require('aws-sdk');
const awsS3Client = new AWS.S3();
const bucketEnvVar = '{{bucketEnvVar}}'; // This value is replaced from test

exports.handler = async (event, context) => {
  let listObjects = await awsS3Client
    .listObjectsV2({
      Bucket: process.env[bucketEnvVar],
    })
    .promise();

  return listObjects;
};
