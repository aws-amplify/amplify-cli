const loadConfig = require('../codegen-config');

function isCodegenConfigured(context) {
  const config = loadConfig(context);
  const projects = config.getProjects();
  return projects.length > 0;
}

module.exports = isCodegenConfigured;
