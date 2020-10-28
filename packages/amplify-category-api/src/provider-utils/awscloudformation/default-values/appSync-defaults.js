const uuid = require('uuid');

const getAllDefaults = project => {
  const name = project.projectConfig.projectName.toLowerCase();
  const region = project.amplifyMeta.providers.awscloudformation.Region;
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `appsync${shortId}`,
    apiName: `${name}`,
    serviceRoleName: `serviceRole${shortId}`,
    servicePolicyName: `servicePolicy${shortId}`,
    apiCreationChoice: false,
    region,
    defaultTableName: `Posts${shortId}`,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
