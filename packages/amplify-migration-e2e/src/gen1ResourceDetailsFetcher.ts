import path from 'path';
import { RefactorCategory } from './templategen';
import { getProjectMeta } from '@aws-amplify/amplify-e2e-core';
import { assertIdentityPool, assertStorage, assertUserPool, assertUserPoolClients } from './assertions';

const AMPLIFY_GEN1_BACKUP_ROOT_DIR = '.amplify';
const AMPLIFY_GEN1_BACKUP_MIGRATION_DIR = 'migration';

const resolveGen1RootPath = (projRoot: string, isRevert: boolean) =>
  isRevert ? projRoot : path.join(projRoot, AMPLIFY_GEN1_BACKUP_ROOT_DIR, AMPLIFY_GEN1_BACKUP_MIGRATION_DIR);

async function getGen1AuthResourceDetails(projRoot: string, isRevert = false) {
  const gen1ProjRoot = resolveGen1RootPath(projRoot, isRevert);
  const gen1Meta = getProjectMeta(gen1ProjRoot);
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { gen1UserPoolId } = await assertUserPool(gen1Meta, gen1Region);
  const { gen1IdentityPoolId } = await assertIdentityPool(gen1Meta, gen1Region);
  const { gen1ClientIds } = await assertUserPoolClients(gen1Meta, gen1Region);
  const gen1ClientIdWeb = gen1ClientIds[0];
  const gen1ResourceIds = [gen1UserPoolId, gen1IdentityPoolId, gen1ClientIdWeb];

  return { gen1ResourceIds };
}

async function getGen1StorageResourceDetails(projRoot: string, isRevert = false) {
  const gen1ProjRoot = resolveGen1RootPath(projRoot, isRevert);
  const gen1Meta = getProjectMeta(gen1ProjRoot);
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { gen1BucketName } = await assertStorage(gen1Meta, gen1Region);
  const gen1ResourceIds = [gen1BucketName];
  return { gen1ResourceIds };
}

export async function getGen1ResourceDetails(projRoot: string, category: RefactorCategory, isRevert = false) {
  if (category === 'auth') {
    return await getGen1AuthResourceDetails(projRoot, isRevert);
  } else if (category === 'storage') {
    return await getGen1StorageResourceDetails(projRoot, isRevert);
  }
  throw new Error(`Invalid category for getting Gen 1 resource details ${category}`);
}
