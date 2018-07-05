const uuid = require('uuid');

const getAllDefaults = (project) => {

  const name = project.projectConfig.projectName.toLowerCase();
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `database${shortId}`,
    tableName: `${name}${uuid().replace(/-/g, '')}`,
    accessLevel: 'Public'
  };
  return defaults;
};

module.exports = {
  getAllDefaults,
};
