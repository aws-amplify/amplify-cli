import { S3 } from 'aws-sdk'

import fs = require('fs');

async function promisify<I, O>(
    fun: (arg: I, cb: (e: Error, d: O) => void) => void,
    args: I,
    that: any
): Promise<O> {
    return await new Promise<O>((resolve, reject) => {
        fun.apply(
            that,
            [
                args,
                (err: Error, data: O) => {
                    if (err) {
                        return reject(err)
                    }
                    resolve(data)
                }
            ]
        )
    })
}

export class S3Client {

    client: S3

    constructor(public region: string) {
        this.client = new S3({ region: this.region });
    }

    async createBucket(bucketName: string) {
        return await promisify<S3.Types.CreateBucketRequest, S3.Types.CreateBucketOutput>(
            this.client.createBucket,
            {
                Bucket: bucketName,
            },
            this.client
        )
    }

    async putBucketVersioning(bucketName: string) {
        return await promisify<S3.Types.PutBucketVersioningRequest, {}>(
            this.client.putBucketVersioning,
            {
                Bucket: bucketName,
                VersioningConfiguration: {
                    Status: "Enabled"
                }
            },
            this.client
        )
    }

    async uploadZIPFile(bucketName: string, filePath: string, s3key: string, contentType: string = 'application/zip') {
        const fileContent = this.readZIPFile(filePath)

        return await promisify<S3.Types.PutObjectRequest, S3.Types.PutObjectOutput>(
            this.client.putObject,
            {
                Bucket: bucketName,
                Key: s3key,
                Body: fileContent,
                ContentType: contentType
            },
            this.client
        )
    }

    async uploadFile(bucketName: string, filePath: string, s3key: string) {

        const fileContent = this.readFile(filePath)

        return await promisify<S3.Types.PutObjectRequest, S3.Types.PutObjectOutput>(
            this.client.putObject,
            {
                Bucket: bucketName,
                Key: s3key,
                Body: fileContent
            },
            this.client
        )
    }

    async getFileVersion(bucketName: string, s3key: string) {
        return await promisify<S3.Types.GetObjectRequest, S3.Types.GetObjectOutput>(
            this.client.getObject,
            {
                Bucket: bucketName,
                Key: s3key
            },
            this.client
        )
    }

    async getAllObjectVersions(bucketName: string) {
        return await promisify<S3.Types.ListObjectVersionsRequest, S3.Types.ListObjectVersionsOutput>(
            this.client.listObjectVersions,
            {
                Bucket: bucketName
            },
            this.client
        )
    }

    async deleteObjectVersion(bucketName: string, versionId: string, s3key: string) {
        return await promisify<S3.Types.DeleteObjectRequest, S3.Types.DeleteObjectOutput>(
            this.client.deleteObject,
            {
                Bucket: bucketName,
                Key: s3key,
                VersionId: versionId
            },
            this.client
        )
    }

    async deleteFile(bucketName: string, s3key: string) {
        const response = await this.getAllObjectVersions(bucketName)
        const versions = response.Versions
        for (const version of versions) {
            await this.deleteObjectVersion(bucketName, version.VersionId, s3key)
        }
    }

    async deleteBucket(bucketName: string) {
        return await promisify<S3.Types.DeleteBucketRequest, {}>(
            this.client.deleteBucket,
            {
                Bucket: bucketName
            },
            this.client
        )
    }

    async setUpS3Resources(bucketName: string, filePath: string, s3key: string, zip?: boolean) {
        await this.createBucket(bucketName)
        await this.putBucketVersioning(bucketName)
        if (zip) {
            await this.uploadZIPFile(bucketName, filePath, s3key)
        } else {
            await this.uploadFile(bucketName, filePath, s3key)
        }
        return await this.getFileVersion(bucketName, s3key)
    }

    async cleanUpS3Resources(bucketName: string, s3key: string) {
        await this.deleteFile(bucketName, s3key)
        await this.deleteBucket(bucketName)
    }

    private readFile(filePath: string) {
        return fs.readFileSync(filePath, "utf8")
    }

    private readZIPFile(filePath: string) {
        return fs.createReadStream(filePath)
    }

    public async wait<T>(secs: number, fun: (...args: any[]) => Promise<T>, ...args: any[]): Promise<T> {
        return new Promise<T>((resolve) => {
            setTimeout(() => {
                resolve(fun.apply(this, args))
            }, 1000 * secs)
        })
    }
}
