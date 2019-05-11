import { S3Client } from './S3Client'
import { CloudFormationClient } from './CloudFormationClient'
import * as fs from 'fs'
import * as path from 'path'
import { DeploymentResources } from 'graphql-transformer-core/lib/DeploymentResources';

function deleteDirectory(directory: string) {
    const files = fs.readdirSync(directory)
    for (const file of files) {
        const contentPath = path.join(directory, file)
        if (fs.lstatSync(contentPath).isDirectory()) {
            deleteDirectory(contentPath)
            fs.rmdirSync(contentPath)
        } else {
            fs.unlinkSync(contentPath)
        }
    }
}

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
            const fileKey = s3Location
            await client.wait(.25, () => Promise.resolve())
            const fileContents = await fs.readFileSync(contentPath)
            console.log(`Uploading file to ${bucket}/${fileKey}`)
            await client.client.putObject({
                Bucket: bucket,
                Key: fileKey,
                Body: fileContents
            }).promise()
            const formattedName = file.split('.').map((s, i) => i > 0 ? `${s[0].toUpperCase()}${s.slice(1, s.length)}` : s).join('')
            s3LocationMap[formattedName] = 's3://' + path.join(bucket, fileKey)
        }
    }
    return s3LocationMap
}

function writeDeploymentToDisk(deployment: DeploymentResources, directory: string) {

    // Write the schema to disk
    const schema = deployment.schema;
    const fullSchemaPath = path.normalize(directory + `/schema.graphql`)
    fs.writeFileSync(fullSchemaPath, schema)

    // Write resolvers to disk
    const resolverFileNames = Object.keys(deployment.resolvers);
    const resolverRootPath = path.normalize(directory + `/resolvers`)
    if (!fs.existsSync(resolverRootPath)) {
        fs.mkdirSync(resolverRootPath);
    }
    for (const resolverFileName of resolverFileNames) {
        const fullResolverPath = path.normalize(resolverRootPath + '/' + resolverFileName);
        fs.writeFileSync(fullResolverPath, deployment.resolvers[resolverFileName]);
    }

    // Write the stacks to disk
    const stackNames = Object.keys(deployment.stacks);
    const stackRootPath = path.normalize(directory + `/stacks`)
    if (!fs.existsSync(stackRootPath)) {
        fs.mkdirSync(stackRootPath);
    }
    for (const stackFileName of stackNames) {
        const fullStackPath = path.normalize(stackRootPath + '/' + stackFileName + '.json');
        fs.writeFileSync(fullStackPath, JSON.stringify(deployment.stacks[stackFileName], null, 4));
    }

    // Write any functions to disk
    const functionNames = Object.keys(deployment.functions);
    const functionRootPath = path.normalize(directory + `/functions`)
    if (!fs.existsSync(functionRootPath)) {
        fs.mkdirSync(functionRootPath);
    }
    for (const functionName of functionNames) {
        const fullFunctionPath = path.normalize(functionRootPath + '/' + functionName);
        const zipContents = fs.readFileSync(deployment.functions[functionName])
        fs.writeFileSync(fullFunctionPath, zipContents);
    }

    // Write any pipeline functions to disk
    const pipelineFunctions = Object.keys(deployment.pipelineFunctions);
    const pipelineFunctionsPath = path.normalize(directory + `/pipelineFunctions`)
    if (!fs.existsSync(pipelineFunctionsPath)) {
        fs.mkdirSync(pipelineFunctionsPath);
    }
    for (const pipelineFunctionName of pipelineFunctions) {
        const fullFunctionPath = path.normalize(pipelineFunctionsPath + '/' + pipelineFunctionName);
        fs.writeFileSync(fullFunctionPath, deployment.pipelineFunctions[pipelineFunctionName]);
    }

    const rootStack = deployment.rootStack;
    const rootStackPath = path.normalize(directory + `/rootStack.json`);
    fs.writeFileSync(rootStackPath, JSON.stringify(rootStack, null, 4));
}

export async function cleanupS3Bucket(
    s3Client: S3Client, buildPath: string, bucketName: string, rootKey: string, buildTimestamp: string) {
    return cleanupBucket(s3Client, buildPath, bucketName, rootKey, buildTimestamp);
}

export async function deploy(
    s3Client: S3Client, cf: CloudFormationClient, stackName: string,
    deploymentResources: DeploymentResources, params: any, buildPath: string,
    bucketName: string, rootKey: string, buildTimeStamp: string
) {
    try {
        if (!fs.existsSync(buildPath)) {
            fs.mkdirSync(buildPath);
        }
        console.log(`Cleaning up previous deployments...`)
        deleteDirectory(buildPath)
        console.log(`Done cleaning up previous deployments.`)
    } catch (e) {
        console.error(`Error cleaning up build directory: ${e}`)
    }
    try {
        console.log('Adding APIKey to deployment')
        addAPIKeys(deploymentResources);
        console.log('Finished adding APIKey to deployment')

        console.log('Writing deployment to disk...')
        writeDeploymentToDisk(deploymentResources, buildPath);
        console.log('Finished writing deployment to disk.')
    } catch (e) {
        console.error(`Error writing files to disk: ${e}`)
        throw(e);
    }
    const s3RootKey = `${rootKey}/${buildTimeStamp}`
    try {
        console.log('Uploading deployment to S3...')
        await uploadDirectory(s3Client, buildPath, bucketName, s3RootKey)
        console.log('Finished uploading deployment to S3.')
    } catch (e) {
        console.log(`Error uploading deployment to s3: ${e}`)
        throw e;
    }
    try {
        console.log(`Deploying root stack...`);
        await cf.createStack(
            deploymentResources.rootStack,
            stackName,
            {
                ...params,
                S3DeploymentBucket: bucketName,
                S3DeploymentRootKey: s3RootKey
            }
        )
        const finishedStack = await cf.waitForStack(stackName)
        console.log(`Done deploying root stack...`);
        await cf.wait(10, () => Promise.resolve())
        return finishedStack
    } catch (e) {
        console.log(`Error deploying cloudformation stack: ${e}`)
        throw(e);
    }
}

function addAPIKeys(stack: DeploymentResources) {
    if (!stack.rootStack.Resources.GraphQLAPIKey) {
        stack.rootStack.Resources.GraphQLAPIKey = {
            "Type": "AWS::AppSync::ApiKey",
            "Properties": {
                "ApiId": {
                    "Fn::GetAtt": [
                        "GraphQLAPI",
                        "ApiId"
                    ]
                }
            }
        }
    }

    if (!stack.rootStack.Outputs.GraphQLAPIKeyOutput) {
        stack.rootStack.Outputs.GraphQLAPIKeyOutput = {
            "Value": {
                "Fn::GetAtt": [
                    "GraphQLAPIKey",
                    "ApiKey"
                ]
            },
        }
    }
}