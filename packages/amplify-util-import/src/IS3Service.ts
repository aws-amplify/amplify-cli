import { Bucket } from '@aws-sdk/client-s3';

export interface IS3Service {
  listBuckets(): Promise<Bucket[]>;
  bucketExists(bucketName: string): Promise<boolean>;
  getBucketLocation(bucketName: string): Promise<string>;
}
