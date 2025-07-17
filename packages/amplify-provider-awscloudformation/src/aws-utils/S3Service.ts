import { $TSContext, AmplifyFault } from '@aws-amplify/amplify-cli-core';
import { IS3Service } from '@aws-amplify/amplify-util-import';
import { S3Client, ListBucketsCommand, HeadBucketCommand, GetBucketLocationCommand, Bucket } from '@aws-sdk/client-s3';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';

export const createS3Service = async (context: $TSContext): Promise<S3Service> => {
  const credentials = await tryGetCredentials(context);
  const s3Client = new S3Client({
    ...credentials,
  });

  return new S3Service(s3Client);
};

export class S3Service implements IS3Service {
  private cachedBucketList: Bucket[] = [];

  public constructor(private s3Client: S3Client) {}

  public async listBuckets(): Promise<Bucket[]> {
    if (this.cachedBucketList.length === 0) {
      const command = new ListBucketsCommand({});
      const response = await this.s3Client.send(command);

      if (response.Buckets) {
        this.cachedBucketList.push(...response.Buckets);
      }
    }

    return this.cachedBucketList;
  }

  private async checkIfBucketExists(bucketName: string, s3Client?: S3Client): Promise<boolean> {
    const client = s3Client ?? this.s3Client;
    try {
      const command = new HeadBucketCommand({ Bucket: bucketName });
      const response = await client.send(command);
      // If the return object has no keys then it means successful empty object was returned.
      return Object.keys(response).length === 0;
    } catch (error) {
      // workaround for S3 service bug causing headBucket for a opt-in region bucket to respond with BadRequest if s3 client is initialized with a different region
      if (error.region !== client.config.region && error.name === 'BadRequest') {
        const newClient = new S3Client({
          ...client.config?.credentials,
          region: error.region,
        });
        return this.checkIfBucketExists(bucketName, newClient);
      }

      return handleS3Error(error);
    }
  }

  public async bucketExists(bucketName: string): Promise<boolean> {
    return this.checkIfBucketExists(bucketName);
  }

  public async getBucketLocation(bucketName: string): Promise<string> {
    const command = new GetBucketLocationCommand({
      Bucket: bucketName,
    });
    const response = await this.s3Client.send(command);

    // For us-east-1 buckets the LocationConstraint is always empty, we have to return a
    // region in every case.
    // https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLocation.html
    if (
      response.LocationConstraint === undefined ||
      response.LocationConstraint.toString() === '' ||
      response.LocationConstraint === null
    ) {
      return 'us-east-1';
    }
    return response.LocationConstraint;
  }
}

const handleS3Error = (error: { name: string; message: string }): boolean => {
  if (error.name === 'NotFound') {
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
