import { $TSAny, $TSContext } from 'amplify-cli-core';
import { IS3Service } from 'amplify-util-import';
import S3, { Bucket } from 'aws-sdk/clients/s3';
import { loadConfiguration } from '../configuration-manager';

export const createS3Service = async (context: $TSContext, options: $TSAny): Promise<S3Service> => {
  let credentials = {};

  try {
    credentials = await loadConfiguration(context);
  } catch (e) {
    // could not load credentials
  }

  const s3 = new S3({ ...credentials, ...options });

  return new S3Service(s3);
};

export class S3Service implements IS3Service {
  private cachedBucketList: Bucket[] = [];

  public constructor(private s3: S3) {}

  public async listBuckets(): Promise<Bucket[]> {
    if (this.cachedBucketList.length === 0) {
      const response = await this.s3.listBuckets().promise();

      if (response.Buckets) {
        this.cachedBucketList.push(...response.Buckets!);
      }
    }

    return this.cachedBucketList;
  }

  public async bucketExists(bucketName: string): Promise<boolean> {
    const response = await this.s3
      .headBucket({
        Bucket: bucketName,
      })
      .promise();

    // If the return object has no keys then it means successful empty object was returned.
    return Object.keys(response).length === 0;
  }

  public async getBucketLocation(bucketName: string): Promise<string> {
    const response = await this.s3
      .getBucketLocation({
        Bucket: bucketName,
      })
      .promise();

    // For us-east-1 buckets the LocationConstraint is always emtpy, we have to return a
    // region in every case.
    // https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLocation.html
    if (response.LocationConstraint === '' || response.LocationConstraint === null) {
      return 'us-east-1';
    }

    return response.LocationConstraint;
  }
}
