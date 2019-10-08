const uuid = require('uuid');

const getAllDefaults = project => {
  const name = project.projectConfig.projectName.toLowerCase();
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `dynamo${shortId}`,
    tableName: `${name}${uuid().replace(/-/g, '')}`,
  };
  return defaults;
};

module.exports = {
  getAllDefaults,
};
