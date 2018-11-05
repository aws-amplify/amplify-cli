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
console.log('///////////////1'); 
console.log(graphQLConfig);
console.log(graphQLConfig.gqlConfig);
console.log(graphQLConfig.shouldGenerateDocs)

  const api = newAPIs[0];
  const schemaLocation = getSchemaDownloadLocation(context, graphQLConfig.gqlConfig.projectName);
  const schema = await downloadIntrospectionSchema(context, api.id, schemaLocation);
console.log('///////////////2');
  const newProject = graphQLConfig.gqlConfig;
  newProject.amplifyExtension.graphQLApiId = api.id;
  newProject.endpoint = api.endpoint;
  newProject.schema = schema;

  console.log('///////////////3');
  config.addProject(newProject);

  console.log('///////////////4');
  config.save();

  console.log('///////////////5');
  if (graphQLConfig.shouldGenerateDocs) {
    generateStatements(context);
  }
  console.log('///////////////6');
  generateTypes(context);
}

module.exports = postPushCallback;
