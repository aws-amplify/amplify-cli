const loadConfig = require('../codegen-config');
const askShouldUpdateCode = require('../walkthrough/questions/updateCode');
const askShouldGenerateDocs = require('../walkthrough/questions/generateCode');

async function prePushUpdateCallback(context, resourceName) {
  const config = loadConfig(context);
  const project = config
    .getProjects()
    .find(projectItem => projectItem.projectName === resourceName);
  if (project) {
    if (await askShouldUpdateCode()) {
      const shouldGenerateDocs = await askShouldGenerateDocs();
      return {
        gqlConfig: project,
        shouldGenerateDocs,
      };
    }
  }
}

module.exports = prePushUpdateCallback;
