import { getProjectOutputs } from './projectOutputs';
import { getResourceDetails } from './sdk_calls';
import { RefactorCategory } from './templategen';

async function getGen2AuthResourceDetails(projRoot: string) {
  const gen2Meta = getProjectOutputs(projRoot);
  const gen2UserPoolId = gen2Meta.auth.user_pool_id;
  const gen2ClientIdWeb = gen2Meta.auth.user_pool_client_id;
  const gen2IdentityPoolId = gen2Meta.auth.identity_pool_id;
  const gen2ResourceIds = [gen2UserPoolId, gen2IdentityPoolId, gen2ClientIdWeb];

  return { gen2ResourceIds };
}

async function getGen2StorageResourceDetails(projRoot: string) {
  const gen2Meta = getProjectOutputs(projRoot);
  const gen2BucketName = gen2Meta.storage.bucket_name;
  const gen2ResourceIds = [gen2BucketName];
  return { gen2ResourceIds };
}

export async function getGen2ResourceDetails(projRoot: string, category: RefactorCategory) {
  if (category === 'auth') {
    return await getGen2AuthResourceDetails(projRoot);
  } else if (category === 'storage') {
    return await getGen2StorageResourceDetails(projRoot);
  }
  throw new Error(`Invalid category for getting Gen 2 resource details ${category}`);
}
