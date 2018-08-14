import { S3Client } from './S3Client'
import { CloudFormationClient } from './CloudFormationClient'
import * as fs from 'fs'
import * as path from 'path'

async function cleanupBucket(client: S3Client, directory: string, bucket: string, key: string) {
    const files = fs.readdirSync(directory)
    for (const file of files) {
        const contentPath = path.join(directory, file)
        const s3Location = path.join(key, file)
        if (fs.lstatSync(contentPath).isDirectory()) {
            await cleanupBucket(client, contentPath, bucket, s3Location)
        } else {
            await client.deleteFile(bucket, s3Location)
        }
    }
}

async function uploadDirectory(client: S3Client, directory: string, bucket: string, key: string) {
    let s3LocationMap = {}
    const files = fs.readdirSync(directory)
    for (const file of files) {
        const contentPath = path.join(directory, file)
        const s3Location = path.join(key, file)
        if (fs.lstatSync(contentPath).isDirectory()) {
            const recMap = await uploadDirectory(client, contentPath, bucket, s3Location)
            s3LocationMap = { ...recMap, ...s3LocationMap }
        } else {
            await client.uploadFile(bucket, contentPath, s3Location)
            const formattedName = file.split('.').map((s, i) => i > 0 ? `${s[0].toUpperCase()}${s.slice(1, s.length)}` : s).join('')
            s3LocationMap[formattedName] = 's3://' + path.join(bucket, s3Location)
        }
    }
    return s3LocationMap
}

export async function deploy(
    s3Client: S3Client, cf: CloudFormationClient, stackName: string,
    template: any, params: any, buildPath: string, bucketName: string, rootKey: string) {
    await cleanupBucket(s3Client, buildPath, bucketName, rootKey)
    console.log('UPLOADING ASSETS')
    const uploadedKeys = await uploadDirectory(s3Client, buildPath, bucketName, rootKey)
    console.log('DONE UPLOADING')
    console.log(uploadedKeys)
    console.log('[start] creating stack ' + stackName)
    const createStackResponse = await cf.createStack(
        template,
        stackName,
        {
            ...params,
            ...uploadedKeys
        }
    )
    const finishedStack = await cf.waitForStack(stackName)
    console.log('[done] creating stack...')
    console.log(JSON.stringify(finishedStack, null, 4))
    // Arbitrary wait to make sure everything is ready.
    await cf.wait(10, () => Promise.resolve())
    return finishedStack
}