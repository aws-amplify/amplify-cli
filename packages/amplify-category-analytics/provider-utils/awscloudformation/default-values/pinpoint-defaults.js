const uuid = require('uuid');

const getAllDefaults = project => {
  const appName = project.projectConfig.projectName.toLowerCase();
  const [shortId] = uuid().split('-');

  const authRoleName = {
    Ref: 'AuthRoleName',
  };

  const unauthRoleName = {
    Ref: 'UnauthRoleName',
  };

  const authRoleArn = {
    'Fn::GetAtt': ['AuthRole', 'Arn'],
  };

  const defaults = {
    appName,
    resourceName: appName,
    roleName: `pinpointLambdaRole${shortId}`,
    cloudWatchPolicyName: `cloudWatchPolicy${shortId}`,
    pinpointPolicyName: `pinpointPolicy${shortId}`,
    authPolicyName: `pinpoint_amplify_${shortId}`,
    unauthPolicyName: `pinpoint_amplify_${shortId}`,
    authRoleName,
    unauthRoleName,
    authRoleArn,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
