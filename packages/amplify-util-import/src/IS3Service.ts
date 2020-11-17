import { Buckets } from 'aws-sdk/clients/s3';

export interface IS3Service {
  listBuckets(): Promise<Buckets>;
  bucketExists(bucketName: string): Promise<boolean>;
}
