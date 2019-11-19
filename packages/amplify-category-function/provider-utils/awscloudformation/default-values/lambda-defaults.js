const uuid = require('uuid');

const getAllDefaults = project => {
  const appName = project.projectConfig.projectName.toLowerCase().replace(/[^0-9a-zA-Z]/gi, '');
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
