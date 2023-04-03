import { S3 } from './aws-utils/aws-s3';
export declare const downloadZip: (s3: S3, tempDir: string, zipFileName: string, envName: string) => Promise<string>;
export declare const extractZip: (tempDir: string, zipFile: string) => Promise<string>;
//# sourceMappingURL=zip-util.d.ts.map