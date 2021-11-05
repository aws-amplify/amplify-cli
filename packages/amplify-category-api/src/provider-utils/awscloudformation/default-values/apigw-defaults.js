const uuid = require('uuid');

const getAllDefaults = project => {
  const name = project.projectConfig.projectName.toLowerCase().replace(/[^0-9a-zA-Z]/gi, '');
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `api${shortId}`,
    apiName: `${name}${shortId}`,
    paths: [],
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
