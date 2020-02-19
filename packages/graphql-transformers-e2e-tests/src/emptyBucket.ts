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
      console.log(`Deleting keys: \n${JSON.stringify(objectIds, null, 4)}`);
      const response = await awsS3Client
        .deleteObjects({
          Bucket: bucket,
          Delete: {
            Objects: objectIds,
          },
        })
        .promise();
      console.error(JSON.stringify(response.Errors, null, 4));
    } catch (e) {
      console.error(`Error deleting objects: ${e}`);
    }
    if (listObjects.NextContinuationToken) {
      console.log(`Listing next page of objects after token: ${listObjects.NextContinuationToken}`);
      listObjects = await awsS3Client
        .listObjectsV2({
          Bucket: bucket,
          ContinuationToken: listObjects.NextContinuationToken,
        })
        .promise();
    } else {
      console.log(`Finished deleting keys`);
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
