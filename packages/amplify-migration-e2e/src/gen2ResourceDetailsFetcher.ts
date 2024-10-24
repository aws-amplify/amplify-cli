import { getProjectOutputs } from './projectOutputs';
import { getResourceDetails } from './sdk_calls';
import { RefactorCategory } from './templategen';

async function getGen2AuthResourceDetails(projRoot: string) {
  const gen2Meta = getProjectOutputs(projRoot);
  const gen2Region = gen2Meta.auth.aws_region;
  const gen2UserPoolId = gen2Meta.auth.user_pool_id;
  const gen2ClientIdWeb = gen2Meta.auth.user_pool_client_id;
  const gen2IdentityPoolId = gen2Meta.auth.identity_pool_id;
  const gen2ResourceIds = [gen2UserPoolId, gen2IdentityPoolId, gen2ClientIdWeb];

  const gen2ResourceDetails = await Promise.all([
    getResourceDetails('AWS::Cognito::UserPool', gen2UserPoolId, gen2Region),
    getResourceDetails('AWS::Cognito::IdentityPool', gen2IdentityPoolId, gen2Region),
    getResourceDetails('AWS::Cognito::UserPoolClient', `${gen2UserPoolId}|${gen2ClientIdWeb}`, gen2Region),
  ]);

  return { gen2ResourceIds, gen2ResourceDetails };
}

async function getGen2StorageResourceDetails(projRoot: string) {
  const gen2Meta = getProjectOutputs(projRoot);
  const gen2Region = gen2Meta.auth.aws_region;
  const gen2BucketName = gen2Meta.storage.bucket_name;
  const gen2ResourceIds = [gen2BucketName];
  const gen2ResourceDetails = await getResourceDetails('AWS::S3::Bucket', gen2BucketName, gen2Region);
  return { gen2ResourceIds, gen2ResourceDetails };
}

export async function getGen2ResourceDetails(projRoot: string, category: RefactorCategory) {
  if (category === 'auth') {
    return await getGen2AuthResourceDetails(projRoot);
  } else {
    return await getGen2StorageResourceDetails(projRoot);
  }
}
