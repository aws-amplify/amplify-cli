const uuid = require('uuid');

const getAllDefaults = (project) => {
  const name = project.projectConfig.ProjectName.toLowerCase();
  const defaults = {
    resourceName: `storage${uuid().replace(/-/g, '')}`,
    bucketName: `${name}${uuid().replace(/-/g, '')}`,
    bucketPolicy: 'Private',
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
