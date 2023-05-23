import { $TSContext, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { IS3Service } from '@aws-amplify/amplify-util-import';
import { S3 } from 'aws-sdk';
import { Bucket } from 'aws-sdk/clients/s3';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';

export const createS3Service = async (context: $TSContext): Promise<S3Service> => {
  const credentials = await tryGetCredentials(context);
  const s3 = new S3({ ...credentials });

  return new S3Service(s3);
};

export class S3Service implements IS3Service {
  private cachedBucketList: Bucket[] = [];

  public constructor(private s3: S3) {}

  public async listBuckets(): Promise<Bucket[]> {
    if (this.cachedBucketList.length === 0) {
      const response = await this.s3.listBuckets().promise();

      if (response.Buckets) {
        this.cachedBucketList.push(...response.Buckets);
      }
    }

    return this.cachedBucketList;
  }

  private async checkIfBucketExists(bucketName: string, s3?: S3): Promise<boolean> {
    const s3Client = s3 ?? this.s3;
    try {
      const response = await s3Client.headBucket({ Bucket: bucketName }).promise();
      // If the return object has no keys then it means successful empty object was returned.
      return Object.keys(response).length === 0;
    } catch (error) {
      // workaround for S3 service bug causing headBucket for a opt-in region bucket to respond with BadRequest if s3 client is initialized with a different region
      if (error.region !== s3Client.config.region && error.code === 'BadRequest') {
        return this.checkIfBucketExists(bucketName, new S3({ ...s3Client.config?.credentials, region: error.region }));
      }

      return handleS3Error(error);
    }
  }

  public async bucketExists(bucketName: string): Promise<boolean> {
    return this.checkIfBucketExists(bucketName);
  }

  public async getBucketLocation(bucketName: string): Promise<string> {
    const response = await this.s3
      .getBucketLocation({
        Bucket: bucketName,
      })
      .promise();
    // For us-east-1 buckets the LocationConstraint is always empty, we have to return a
    // region in every case.
    // https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLocation.html
    if (response.LocationConstraint === undefined || response.LocationConstraint === '' || response.LocationConstraint === null) {
      return 'us-east-1';
    }
    return response.LocationConstraint;
  }
}

const handleS3Error = (error: { code: string; message: string }): boolean => {
  if (error.code === 'NotFound') {
    return false;
  }
  throw new AmplifyFault(
    'UnknownFault',
    {
      message: error.message,
    },
    error as unknown as Error,
  );
};

const tryGetCredentials = async (context: $TSContext): Promise<AwsSecrets> => {
  try {
    return await loadConfiguration(context);
  } catch (e) {
    // could not load credentials
  }

  return {};
};
