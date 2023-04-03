import { $TSAny, $TSContext } from 'amplify-cli-core';
import { ListObjectVersionsOutput, ObjectIdentifier } from 'aws-sdk/clients/s3';
type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;
export declare class S3 {
    private static instance;
    private readonly context;
    private readonly s3;
    private uploadState;
    static getInstance(context: $TSContext, options?: {}): Promise<S3>;
    private constructor();
    private populateUploadState;
    private attachBucketToParams;
    uploadFile(s3Params: $TSAny, showSpinner?: boolean): Promise<string>;
    getFile(s3Params: $TSAny, envName?: string): Promise<import("aws-sdk/clients/s3").Body>;
    createBucket(bucketName: string, throwIfExists?: boolean): Promise<string | void>;
    getAllObjectVersions(bucketName: string, options?: OptionalExceptFor<ListObjectVersionsOutput, 'KeyMarker' | 'VersionIdMarker'>): Promise<Required<ObjectIdentifier>[]>;
    deleteDirectory(bucketName: string, dirPath: string): Promise<void>;
    checkExistObject(bucketName: string, filePath: string): Promise<boolean>;
    deleteObject(bucketName: string, filePath: string): Promise<void>;
    deleteAllObjects(bucketName: string): Promise<void>;
    deleteS3Bucket(bucketName: string): Promise<void>;
    emptyS3Bucket(bucketName: string): Promise<void>;
    ifBucketExists(bucketName: string): Promise<boolean>;
    getStringObjectFromBucket: (bucketName: string, objectKey: string) => Promise<string | undefined>;
}
export {};
//# sourceMappingURL=aws-s3.d.ts.map