const path = require('path');
const { pathManager } = require('amplify-cli-core');

const loadConfig = require('../codegen-config');
const generateStatements = require('../commands/statements');
const generateTypes = require('../commands/types');
const generateModels = require('../commands/models');

const { downloadIntrospectionSchema, getAppSyncAPIDetails, getSchemaDownloadLocation } = require('../utils');

async function postPushCallback(context, graphQLConfig) {
  if (!graphQLConfig) {
    return;
  }

  try {
    if (!graphQLConfig.gqlConfig.schema) {
      const config = loadConfig(context);

      const projectPath = pathManager.findProjectRoot() || process.cwd();
      const schemaLocation = path.join(projectPath, getSchemaDownloadLocation(context));

      const newProject = graphQLConfig.gqlConfig;
      newProject.schema = schemaLocation;
      config.addProject(newProject);
      config.save();
    }
    const apis = getAppSyncAPIDetails(context);

    await downloadIntrospectionSchema(context, apis[0].id, graphQLConfig.gqlConfig.schema);
    if (graphQLConfig.shouldGenerateDocs) {
      await generateStatements(context);
    }
    if (graphQLConfig.shouldGenerateModels) {
      await generateModels(context);
    }
    await generateTypes(context);
  } catch (error) {
    // Code Generation failure should not result in actual push failure
    context.print.warning(`Code generation failed with the following error \n${error.message}.`);
  }
}

module.exports = postPushCallback;
