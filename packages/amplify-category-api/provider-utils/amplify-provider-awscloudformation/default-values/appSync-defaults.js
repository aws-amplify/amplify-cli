const uuid = require('uuid');

const getAllDefaults = (project) => {
  const name = project.projectConfig.projectName.toLowerCase();
  const region = project.amplifyMeta.providers['amplify-provider-awscloudformation'].Region;
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `appsync${shortId}`,
    apiName: `${name}${shortId}`,
    serviceRoleName: `serviceRole${shortId}`,
    servicePolicyName: `servicePolicy${shortId}`,
    region,
    defaultTableName: `Posts${shortId}`
  };
  console.log(defaults);
  return defaults;
};

module.exports = {
  getAllDefaults,
};
