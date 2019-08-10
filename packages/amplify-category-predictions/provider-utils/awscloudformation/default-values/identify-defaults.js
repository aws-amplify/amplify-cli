const uuid = require('uuid');

export default function getAllDefaults(project) {
  const region = project.amplifyMeta.providers.awscloudformation.Region;
  const [shortId] = uuid().split('-');
  const authRoleName = {
    Ref: 'AuthRoleName',
  };

  const unauthRoleName = {
    Ref: 'UnauthRoleName',
  };

  const defaults = {
    resourceName: `${shortId}`,
    region,
    identifyPolicyName: `identifyPolicy${shortId}`,
    service: 'Rekognition',
    authRoleName,
    unauthRoleName,
    adminAuthProtected: 'DISALLOW',
    adminGuestProtected: 'DISALLOW',
  };

  return defaults;
}
