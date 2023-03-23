import S3, { Buckets } from 'aws-sdk/clients/s3';

export interface IS3Service {
  listBuckets(): Promise<Buckets>;
  bucketExists(bucketName: string, s3?: S3): Promise<boolean>;
  getBucketLocation(bucketName: string): Promise<string>;
}
