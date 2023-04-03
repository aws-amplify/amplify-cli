import { $TSContext } from 'amplify-cli-core';
import { IS3Service } from '@aws-amplify/amplify-util-import';
import { S3 } from 'aws-sdk';
import { Bucket } from 'aws-sdk/clients/s3';
export declare const createS3Service: (context: $TSContext) => Promise<S3Service>;
export declare class S3Service implements IS3Service {
    private s3;
    private cachedBucketList;
    constructor(s3: S3);
    listBuckets(): Promise<Bucket[]>;
    private checkIfBucketExists;
    bucketExists(bucketName: string): Promise<boolean>;
    getBucketLocation(bucketName: string): Promise<string>;
}
//# sourceMappingURL=S3Service.d.ts.map