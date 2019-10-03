const loadConfig = require('../codegen-config');

function isCodegenConfigured(context, apiName) {
  const config = loadConfig(context);
  const projects = config.getProjects();
  if (apiName) {
    const isConfigured = projects.find(p => p.projectName === apiName);
    return isConfigured !== undefined;
  }

  return projects.length > 0;
}

module.exports = isCodegenConfigured;
