import { default as S3 } from 'aws-sdk/clients/s3';
const awsS3Client = new S3({ region: 'us-west-2' });

const emptyBucket = async (bucket: string) => {
  let listObjects = await awsS3Client
    .listObjectsV2({
      Bucket: bucket,
    })
    .promise();
  while (true) {
    try {
      const objectIds = listObjects.Contents.map(content => ({
        Key: content.Key,
      }));
      const response = await awsS3Client
        .deleteObjects({
          Bucket: bucket,
          Delete: {
            Objects: objectIds,
          },
        })
        .promise();
    } catch (e) {
      console.error(`Error deleting objects: ${e}`);
    }
    if (listObjects.NextContinuationToken) {
      listObjects = await awsS3Client
        .listObjectsV2({
          Bucket: bucket,
          ContinuationToken: listObjects.NextContinuationToken,
        })
        .promise();
    } else {
      break;
    }
  }
  try {
    await awsS3Client
      .deleteBucket({
        Bucket: bucket,
      })
      .promise();
    const params = {
      Bucket: bucket,
      $waiter: { maxAttempts: 10 },
    };
    await awsS3Client.waitFor('bucketNotExists', params).promise();
  } catch (e) {
    console.error(`Error deleting bucket: ${e}`);
  }
};
export default emptyBucket;
