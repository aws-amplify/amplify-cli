const uuid = require('uuid');

const getAllDefaults = (project) => {
  const name = project.projectConfig.projectName.toLowerCase().replace("-", "_");
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `lex${shortId}`,
    botName: `${name}_bot`,
    sessionTimeout: 5,

  };
  return defaults;
};

module.exports = {
  getAllDefaults,
};
