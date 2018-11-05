const loadConfig = require('../codegen-config');
const generateStatements = require('../commands/statements');
const generateTypes = require('../commands/types');

const {
  downloadIntrospectionSchema,
  getAppSyncAPIDetails,
  getSchemaDownloadLocation,
} = require('../utils');

async function postPushCallback(context, graphQLConfig) {
  if (!graphQLConfig) {
    return;
  }
  const config = loadConfig(context);
  const newAPIs = getAppSyncAPIDetails(context);

  const api = newAPIs[0];
  const schemaLocation = getSchemaDownloadLocation(context, graphQLConfig.gqlConfig.projectName);
  const schema = await downloadIntrospectionSchema(context, api.id, schemaLocation);

  const newProject = graphQLConfig.gqlConfig;
  newProject.amplifyExtension.graphQLApiId = api.id;
  newProject.endpoint = api.endpoint;
  newProject.schema = schema;

  config.addProject(newProject);

  config.save();

  if (graphQLConfig.shouldGenerateDocs) {
    generateStatements(context);
  }
  generateTypes(context);
}

module.exports = postPushCallback;
