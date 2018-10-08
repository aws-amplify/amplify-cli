import { S3Client } from './S3Client'
import { CloudFormationClient } from './CloudFormationClient'
import * as fs from 'fs'
import * as path from 'path'

async function cleanupBucket(
    client: S3Client, directory: string, bucket: string, key: string, buildTimestamp: string) {
    const files = fs.readdirSync(directory)
    for (const file of files) {
        const contentPath = path.join(directory, file)
        const s3Location = path.join(key, file)
        if (fs.lstatSync(contentPath).isDirectory()) {
            await cleanupBucket(client, contentPath, bucket, s3Location, buildTimestamp)
        } else {
            const fileKey = s3Location + '.' + buildTimestamp
            await client.deleteFile(bucket, fileKey)
        }
    }
}

async function uploadDirectory(client: S3Client, directory: string, bucket: string, key: string, buildTimestamp: string) {
    let s3LocationMap = {}
    const files = fs.readdirSync(directory)
    for (const file of files) {
        const contentPath = path.join(directory, file)
        const s3Location = path.join(key, file)
        if (fs.lstatSync(contentPath).isDirectory()) {
            const recMap = await uploadDirectory(client, contentPath, bucket, s3Location, buildTimestamp)
            s3LocationMap = { ...recMap, ...s3LocationMap }
        } else {
            const fileKey = s3Location + '.' + buildTimestamp
            await client.wait(.25, () => Promise.resolve())
            await client.uploadFile(bucket, contentPath, fileKey)
            const formattedName = file.split('.').map((s, i) => i > 0 ? `${s[0].toUpperCase()}${s.slice(1, s.length)}` : s).join('')
            s3LocationMap[formattedName] = 's3://' + path.join(bucket, fileKey)
        }
    }
    return s3LocationMap
}

export async function cleanupS3Bucket(
    s3Client: S3Client, buildPath: string, bucketName: string, rootKey: string, buildTimestamp: string) {
    return cleanupBucket(s3Client, buildPath, bucketName, rootKey, buildTimestamp);
}

export async function deploy(
    s3Client: S3Client, cf: CloudFormationClient, stackName: string,
    template: any, params: any, buildPath: string, bucketName: string, rootKey: string, buildTimeStamp: string) {
    console.log('[start] uploading assets...')
    const uploadedKeys: any = await uploadDirectory(s3Client, buildPath, bucketName, rootKey, buildTimeStamp)
    console.log('[done] uploading assets.')
    console.log('[start] creating stack ' + stackName)
    console.log(uploadedKeys)
    const createStackResponse = await cf.createStack(
        template,
        stackName,
        {
            ...params,
            ResolverBucket: bucketName,
            ResolverRootKey: 'resolvers',
            schemaGraphql: uploadedKeys.schemaGraphql,
            DeploymentTimestamp: buildTimeStamp
        }
    )
    const finishedStack = await cf.waitForStack(stackName)
    console.log('[done] creating stack...')
    // Arbitrary wait to make sure everything is ready.
    await cf.wait(10, () => Promise.resolve())
    return finishedStack
}