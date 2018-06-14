const uuid = require('uuid');

const getAllDefaults = (project) => {
  const name = project.projectConfig.ProjectName.toLowerCase();
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `storage${shortId}`,
    bucketName: `${name}${uuid().replace(/-/g, '')}`,
    bucketPolicy: 'Private',
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
