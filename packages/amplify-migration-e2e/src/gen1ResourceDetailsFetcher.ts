import path from 'path';
import { RefactorCategory } from './templategen';
import { getProjectMeta } from '@aws-amplify/amplify-e2e-core';
import { assertIdentityPool, assertStorage, assertUserPool, assertUserPoolClients } from './assertions';

async function getGen1AuthResourceDetails(projRoot: string) {
  const gen1ProjRoot = path.join(projRoot, '.amplify', 'migration');
  const gen1Meta = getProjectMeta(gen1ProjRoot);
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { gen1UserPoolId } = await assertUserPool(gen1Meta, gen1Region);
  const { gen1IdentityPoolId } = await assertIdentityPool(gen1Meta, gen1Region);
  const { gen1ClientIds } = await assertUserPoolClients(gen1Meta, gen1Region);
  const gen1ClientIdWeb = gen1ClientIds[0];
  const gen1ResourceIds = [gen1UserPoolId, gen1IdentityPoolId, gen1ClientIdWeb];

  return { gen1ResourceIds };
}

async function getGen1StorageResourceDetails(projRoot: string) {
  const gen1ProjRoot = path.join(projRoot, '.amplify', 'migration');
  const gen1Meta = getProjectMeta(gen1ProjRoot);
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { gen1BucketName } = await assertStorage(gen1Meta, gen1Region);
  const gen1ResourceIds = [gen1BucketName];
  return { gen1ResourceIds };
}

export async function getGen1ResourceDetails(projRoot: string, category: RefactorCategory) {
  if (category === 'auth') {
    return await getGen1AuthResourceDetails(projRoot);
  } else if (category === 'storage') {
    return await getGen1StorageResourceDetails(projRoot);
  }
  throw new Error(`Invalid category for getting Gen 1 resource details ${category}`);
}
