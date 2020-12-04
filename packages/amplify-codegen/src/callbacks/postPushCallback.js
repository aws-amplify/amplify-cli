const loadConfig = require('../codegen-config');
const generateStatements = require('../commands/statements');
const generateTypes = require('../commands/types');
const generateModels = require('../commands/models');

const { downloadIntrospectionSchema, getAppSyncAPIDetails, getSchemaDownloadLocation } = require('../utils');

async function postPushCallback(context, graphQLConfig) {
  if (!graphQLConfig) {
    return;
  }

  if (!graphQLConfig.gqlConfig.schema) {
    const config = loadConfig(context);
    const schemaLocation = getSchemaDownloadLocation(context);

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
}

module.exports = postPushCallback;
