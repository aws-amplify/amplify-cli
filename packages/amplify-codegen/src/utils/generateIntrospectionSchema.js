const gqlUtils = require('graphql/utilities');
const path = require('path');
const fs = require('fs-extra');
const getSchemaDownloadLocation = require('./getSchemaDownloadLocation');
const getSDLSchemaPath = require('./getSDLSchemaLocation');

async function generateIntrospectionSchema(context, apiName) {
  const appSyncDirectives = fs.readFileSync(
    path.normalize(path.join(__dirname, '..', '..', 'awsApppSyncDirectives.graphql')),
  );
  const { projectPath } = context.amplify.getEnvInfo();
  const introspectionSchemaPath = path.join(projectPath, getSchemaDownloadLocation(context));
  const sdlSchemaPath = path.join(projectPath, getSDLSchemaPath(apiName));
  const schemaContent = fs.readFileSync(sdlSchemaPath, 'utf8');
  const schema = gqlUtils.buildSchema(`${appSyncDirectives}\n${schemaContent}`);
  const introspectionSchemaContent = gqlUtils.introspectionFromSchema(schema);
  fs.ensureFileSync(introspectionSchemaPath);
  fs.writeFileSync(introspectionSchemaPath, JSON.stringify(introspectionSchemaContent, null, 4));
}

module.exports = generateIntrospectionSchema;
