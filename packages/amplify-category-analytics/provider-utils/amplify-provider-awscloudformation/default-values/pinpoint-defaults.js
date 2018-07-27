const uuid = require('uuid');

const getAllDefaults = (project) => {
  const appName = project.projectConfig.projectName.toLowerCase();
  const [shortId] = uuid().split('-');

  const { amplifyMeta } = project;
  const providerInfo = amplifyMeta.providers['amplify-provider-awscloudformation'];

  const authRoleName = providerInfo.AuthRoleName;
  const unauthRoleName = providerInfo.UnauthRoleName;

  const authRoleArn = providerInfo.AuthRoleArn;

  const splitArn = authRoleArn.split(':');
  const IAMPrefix = splitArn[4];

  const defaults = {
    appName,
    resourceName: `pinpoint${shortId}`,
    roleName: `pinpointLambdaRole${shortId}`,
    cloudWatchPolicyName: `cloudWatchPolicy${shortId}`,
    pinpointPolicyName: `pinpointPolicy${shortId}`,
    authPolicyName: `pinpoint_amplify_${shortId}`,
    unauthPolicyName: `pinpoint_amplify_${shortId}`,
    authRoleName,
    unauthRoleName,
    IAMPrefix,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
