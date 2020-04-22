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

  const defaults = {
    kinesisStreamName: `${appName}Kinesis`,
    kinesisStreamShardCount: 1,
    authRoleName,
    unauthRoleName,
    authPolicyName: `kinesis_amplify_${shortId}`,
    unauthPolicyName: `kinesis_amplify_${shortId}`,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
