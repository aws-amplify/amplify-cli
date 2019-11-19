function graphQlToAmplifyConfig(gqlConfig) {
  const amplifyConfig = [];
  let cfg = getAmplifyConfig(gqlConfig.config);
  if (cfg) {
    amplifyConfig.push({ ...cfg, __root__: true });
  }
  const projects = gqlConfig.getProjects() || {};

  Object.keys(projects).forEach(projectName => {
    const project = projects[projectName];
    cfg = getAmplifyConfig(project.config);

    if (cfg) amplifyConfig.push({ ...cfg, __root__: false, projectName });
  });

  return amplifyConfig;
}

function getAmplifyConfig(config = {}) {
  if (config && config.extensions && config.extensions.amplify && config.includes) {
    if (typeof config.includes === 'string') {
      config.includes = [config.includes];
    }
    return {
      schema: config.schemaPath,
      includes: Array.isArray(config.includes) ? config.includes : [config.includes],
      excludes: Array.isArray(config.excludes) ? config.excludes : [config.excludes],
      amplifyExtension: {
        ...config.extensions.amplify,
      },
    };
  }
}

module.exports = graphQlToAmplifyConfig;
