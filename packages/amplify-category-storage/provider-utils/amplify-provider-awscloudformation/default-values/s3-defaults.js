const uuid = require('uuid');

const getAllDefaults = (project) => {
  const name = project.projectConfig.projectName.toLowerCase();
  const [shortId] = uuid().split('-');

  const { amplifyMeta } = project;
  const providerInfo = amplifyMeta.providers['amplify-provider-awscloudformation'];

  const authRoleName = providerInfo.AuthRoleName;
  const unauthRoleName = providerInfo.UnauthRoleName;

  const defaults = {
    resourceName: `s3${shortId}`,
    bucketName: `${name}${uuid().replace(/-/g, '')}`,
    authPolicyName: `s3_amplify_${shortId}`,
    unauthPolicyName: `s3_amplify_${shortId}`,
    authRoleName,
    unauthRoleName,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
