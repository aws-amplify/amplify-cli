import { CloudControlClient, GetResourceCommand } from '@aws-sdk/client-cloudcontrol';
import { AppSyncClient, GetDataSourceCommand } from '@aws-sdk/client-appsync';
import { CognitoIdentityClient, DescribeIdentityPoolCommand } from '@aws-sdk/client-cognito-identity';
import assert from 'node:assert';
import { delay } from './index';

const MAX_ATTEMPTS = 5;
const FIXED_DELAY = 1000;

export async function getAppSyncDataSource(apiId: string, dataSourceName: string, region: string) {
  const client = new AppSyncClient({ region });
  const command = new GetDataSourceCommand({
    apiId: apiId,
    name: dataSourceName,
  });
  const response = await client.send(command);
  return response.dataSource;
}

export async function getResourceDetails(
  typeName: string,
  identifier: string,
  region: string,
  attempts = MAX_ATTEMPTS,
): Promise<Record<string, unknown> | undefined> {
  if (attempts <= 0) {
    return undefined;
  }
  const client = new CloudControlClient({ region });
  const command = new GetResourceCommand({
    TypeName: typeName,
    Identifier: identifier,
  });
  try {
    const response = await client.send(command);
    const resourceProperties = response.ResourceDescription?.Properties;
    assert(resourceProperties);
    return JSON.parse(resourceProperties);
  } catch (e) {
    // account for eventual consistency with retries
    if (typeof e === 'object' && e !== null && 'message' in e && typeof e.message === 'string' && e.message.includes('NotFound')) {
      console.log(
        `Attempting to get resource details using CloudControl API for ${typeName} type and ${identifier} identifier in ${region} region: ${
          attempts - 1
        } attempts remaining.`,
      );
      await delay(2 ** (MAX_ATTEMPTS - attempts) * FIXED_DELAY);
      return getResourceDetails(typeName, identifier, region, attempts - 1);
    }
    throw e;
  }
}

export async function getIdentityPool(identityPoolId: string, region: string) {
  const client = new CognitoIdentityClient({ region });
  const command = new DescribeIdentityPoolCommand({
    IdentityPoolId: identityPoolId,
  });
  return await client.send(command);
}
