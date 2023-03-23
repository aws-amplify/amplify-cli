import { $TSContext } from 'amplify-cli-core';
import { createS3Service } from '../../aws-utils/S3Service';
import * as AWS from 'aws-sdk';

describe('S3Service', () => {
  const usEastS3 = new AWS.S3({ region: 'us-east-1' });
  const euSouthS3 = new AWS.S3({ region: 'eu-south-1' });

  const bucketNameUsEast = `test-bucket-us-east-1-${Math.floor(Math.random() * 100000)}`;
  const bucketNameEuSouth = `test-bucket-eu-south-1-${Math.floor(Math.random() * 100000)}`;

  beforeAll(async () => {
    await usEastS3.createBucket({ Bucket: bucketNameUsEast }).promise();
    await euSouthS3.createBucket({ Bucket: bucketNameEuSouth }).promise();
  });

  afterAll(async () => {
    await usEastS3.deleteBucket({ Bucket: bucketNameUsEast }).promise();
    await euSouthS3.deleteBucket({ Bucket: bucketNameEuSouth }).promise();
  });

  it('should correctly return if bucket exists in NON opt-in region', async () => {
    const s3service = await createS3Service({} as unknown as $TSContext);
    const bucketExists = await s3service.bucketExists(bucketNameUsEast);
    expect(bucketExists).toBe(true);
  });

  it('should correctly return if bucket exists in opt-in region', async () => {
    const s3service = await createS3Service({} as unknown as $TSContext);
    const bucketExists = await s3service.bucketExists(bucketNameEuSouth);
    expect(bucketExists).toBe(true);
  });
});
