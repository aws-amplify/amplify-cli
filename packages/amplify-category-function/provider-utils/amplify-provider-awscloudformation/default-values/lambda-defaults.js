const uuid = require('uuid');

const getAllDefaults = (project) => {
  const appName = project.projectConfig.projectName.toLowerCase();
  const [shortId] = uuid().split('-');
  const resourceName = `${appName}${shortId}`;

  const defaults = {
    resourceName,
    functionName: resourceName,
    roleName: `${appName}LambdaRole${shortId}`,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
