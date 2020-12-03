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

  const projectPath = pathManager.findProjectRoot();
  if (!projectPath) {
    return;
  }

  if (!graphQLConfig.gqlConfig.schema) {
    const config = loadConfig(context);
    const schemaLocation = getSchemaDownloadLocation(context);

    const newProject = graphQLConfig.gqlConfig;
    newProject.schema = path.join(projectPath, schemaLocation);
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
}

module.exports = postPushCallback;
