const getAllDefaults = (project) => {
  const appName = project.projectConfig.projectName.toLowerCase();

  const defaults = {
    kinesisStreamName: appName,
    kinesisStreamShardCount: 1,
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
