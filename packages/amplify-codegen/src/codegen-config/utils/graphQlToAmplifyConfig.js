function graphQlToAmplifyConfig(gqlConfig) {
  const amplifyConfig = [];
  let cfg = getAmplifyConfig(gqlConfig.config);
  if (cfg) {
    amplifyConfig.push({ ...cfg, __root__: true });
  }
  const projects = gqlConfig.getProjects() || {};
  Object.keys(projects).forEach((projectName) => {
    const project = projects[projectName];
    cfg = getAmplifyConfig(project);
    if (cfg) amplifyConfig.push({ ...cfg, __root__: false, projectName });
  });
  return amplifyConfig;
}

function getAmplifyConfig(config = {}) {
  if (config && config.extensions && config.extensions.amplify && config.includes) {
    return {
      schema: config.schemaPath,
      includes: config.includes,
      excludes: config.excludes || null,
      amplifyExtension: {
        ...config.extensions.amplify,
      },
    };
  }
}

module.exports = graphQlToAmplifyConfig;
