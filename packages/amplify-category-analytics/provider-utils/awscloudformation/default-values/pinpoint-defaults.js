const uuid = require('uuid');

const getAllDefaults = (project) => {
  const appName = project.projectConfig.projectName.toLowerCase();
  const [shortId] = uuid().split('-');
  const defaults = {
    appName,
    resourceName: `pinpoint${shortId}`,
    roleName: `pinpointLambdaRole${shortId}`,
    cloudWatchPolicyName: `cloudWatchPolicy${shortId}`,
    pinpointPolicyName: `pinpointPolicy${shortId}`,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
