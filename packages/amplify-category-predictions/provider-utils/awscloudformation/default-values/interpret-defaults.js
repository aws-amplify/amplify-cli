const uuid = require('uuid');

export default function getAllDefaults(project) {
  const region = project.amplifyMeta.providers.awscloudformation.Region;
  const [shortId] = uuid.v4().split('-');
  const authRoleName = {
    Ref: 'AuthRoleName',
  };

  const unauthRoleName = {
    Ref: 'UnauthRoleName',
  };

  const defaults = {
    resourceName: `${shortId}`,
    region,
    interpretPolicyName: `interpretPolicy${shortId}`,
    service: 'Comprehend',
    authRoleName,
    unauthRoleName,
  };

  return defaults;
}
