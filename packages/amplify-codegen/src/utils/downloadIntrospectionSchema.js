const jetpack = require('fs-jetpack');
const { dirname, relative } = require('path');

async function downloadIntrospectionSchema(context, apiId, downloadLocation) {
  const { amplify } = context;
  const schema = await context.amplify.executeProviderUtils(
    context,
    'awscloudformation',
    'getIntrospectionSchema',
    {
      apiId,
    },
  );
  const introspectionDir = dirname(downloadLocation);
  jetpack.dir(introspectionDir);
  jetpack.write(downloadLocation, schema);
  return relative(amplify.getProjectDetails().projectConfig.projectPath, downloadLocation);
}

module.exports = downloadIntrospectionSchema;
