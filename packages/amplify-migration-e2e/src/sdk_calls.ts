import { CloudControlClient, GetResourceCommand } from '@aws-sdk/client-cloudcontrol';
import { AppSyncClient, GetDataSourceCommand } from '@aws-sdk/client-appsync';
import { CognitoIdentityClient, DescribeIdentityPoolCommand } from '@aws-sdk/client-cognito-identity';
import { S3Client, CreateBucketCommand, BucketLocationConstraint } from '@aws-sdk/client-s3';

export async function createS3Bucket(bucketName: string, region: string) {
  const client = new S3Client({ region });
  const command = new CreateBucketCommand({
    Bucket: bucketName,
    CreateBucketConfiguration: {
      LocationConstraint: region as BucketLocationConstraint,
    },
  });
  const response = await client.send(command);
  return response;
}
export async function getAppSyncDataSource(apiId: string, dataSourceName: string, region: string) {
  const client = new AppSyncClient({ region });
  const command = new GetDataSourceCommand({
    apiId: apiId,
    name: dataSourceName,
  });
  const response = await client.send(command);
  return response.dataSource;
}

export async function getResourceDetails(typeName: string, identifier: string, region: string) {
  const client = new CloudControlClient({ region });
  const command = new GetResourceCommand({
    TypeName: typeName,
    Identifier: identifier,
  });
  const response = await client.send(command);
  return JSON.parse(response.ResourceDescription.Properties);
}

export async function getIdentityPool(identityPoolId: string, region: string) {
  const client = new CognitoIdentityClient({ region });
  const command = new DescribeIdentityPoolCommand({
    IdentityPoolId: identityPoolId,
  });
  const response = await client.send(command);
  return response;
}
