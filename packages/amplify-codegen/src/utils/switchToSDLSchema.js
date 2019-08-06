const loadConfig = require('../codegen-config');
const getSDLSchemaPath = require('./getSDLSchemaLocation');

function switchToSDLSchema(context, apiName) {
  const config = loadConfig(context);
  const projects = config.getProjects();
  const project = projects.find(p => p.projectName === apiName);
  if (project) {
    if (project.schema.endsWith('.json')) {
      project.schema = getSDLSchemaPath(apiName);
      config.addProject(project);
      config.save();
      return true;
    }
    return false;
  }
  throw new Error(`Codegen is not configured with API ${apiName}`);
}

module.exports = switchToSDLSchema;
