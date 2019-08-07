const loadConfig = require('../codegen-config');
const getSDLSchemaPath = require('./getSDLSchemaLocation');
const getFrontendHandler = require('./getFrontEndHandler');

function switchToSDLSchema(context, apiName) {
  if (getFrontendHandler(context) === 'android') {
    return false;
  }
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
