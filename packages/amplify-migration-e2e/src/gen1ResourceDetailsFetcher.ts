import path from 'path';
import { RefactorCategory } from './templategen';
import { getProjectMeta } from '@aws-amplify/amplify-e2e-core';
import { assertIdentityPool, assertStorage, assertUserPool, assertUserPoolClients } from './assertions';
import { getResourceDetails } from './sdk_calls';

async function getGen1AuthResourceDetails(projRoot: string) {
  const gen1ProjRoot = path.join(projRoot, '.amplify', 'migration');
  const gen1Meta = getProjectMeta(gen1ProjRoot);
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { gen1UserPoolId } = await assertUserPool(gen1Meta, gen1Region);
  const { gen1IdentityPoolId } = await assertIdentityPool(gen1Meta, gen1Region);
  const { gen1ClientIds } = await assertUserPoolClients(gen1Meta, gen1Region);
  const [gen1ClientIdWeb, gen1ClientId] = gen1ClientIds;
  const gen1ResourceIds = [gen1UserPoolId, gen1IdentityPoolId, gen1ClientIdWeb];

  const gen1ResourceDetails = await Promise.all([
    getResourceDetails('AWS::Cognito::UserPool', gen1UserPoolId, gen1Region),
    getResourceDetails('AWS::Cognito::IdentityPool', gen1IdentityPoolId, gen1Region),
    getResourceDetails('AWS::Cognito::UserPoolClient', `${gen1UserPoolId}|${gen1ClientIdWeb}`, gen1Region),
  ]);

  return { gen1ResourceIds, gen1ResourceDetails };
}

async function getGen1StorageResourceDetails(projRoot: string) {
  const gen1ProjRoot = path.join(projRoot, '.amplify', 'migration');
  const gen1Meta = getProjectMeta(gen1ProjRoot);
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { gen1BucketName } = await assertStorage(gen1Meta, gen1Region);
  const gen1ResourceIds = [gen1BucketName];
  const gen1ResourceDetails = await getResourceDetails('AWS::S3::Bucket', gen1BucketName, gen1Region);
  return { gen1ResourceIds, gen1ResourceDetails };
}

export async function getGen1ResourceDetails(projRoot: string, category: RefactorCategory) {
  if (category === 'auth') {
    return await getGen1AuthResourceDetails(projRoot);
  } else {
    return await getGen1StorageResourceDetails(projRoot);
  }
}
