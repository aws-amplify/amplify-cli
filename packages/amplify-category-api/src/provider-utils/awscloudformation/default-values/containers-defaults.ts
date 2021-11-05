const uuid = require('uuid');

const getAllDefaults = project => {
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `container${shortId}`,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
