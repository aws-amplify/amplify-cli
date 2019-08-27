const fs = require('fs-extra');
const getFrontendHandler = require('./getFrontEndHandler');
const generateIntrospectionSchema = require('./generateIntrospectionSchema');
const downloadIntrospectionSchemaWithProgress = require('./generateIntrospectionSchemaWithProgress');

async function ensureIntrospectionSchema(
  context,
  schemaPath,
  apiConfig,
  region,
  forceDownloadSchema,
) {
  const meta = context.amplify.getProjectMeta();
  const { id, name } = apiConfig;
  const isTransformedAPI =
    Object.keys(meta.api || {}).includes(name) &&
    meta.api[name].providerPlugin === 'awscloudformation';
  if (isTransformedAPI && getFrontendHandler(context) === 'android') {
    generateIntrospectionSchema(context, name);
  } else if (schemaPath.endsWith('.json')) {
    if (forceDownloadSchema || !fs.existsSync(schemaPath)) {
      await downloadIntrospectionSchemaWithProgress(context, id, schemaPath, region);
    }
  }
}

module.exports = ensureIntrospectionSchema;
