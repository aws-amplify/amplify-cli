const jetpack = require('fs-jetpack');
const { dirname, relative } = require('path');

const { AmplifyCodeGenAPINotFoundError } = require('../errors');
const constants = require('../constants');

async function downloadIntrospectionSchema(context, apiId, downloadLocation, region) {
  const { amplify } = context;
  try {
    const schema = await context.amplify.executeProviderUtils(
      context,
      'awscloudformation',
      'getIntrospectionSchema',
      {
        apiId,
        region,
      },
    );
    const introspectionDir = dirname(downloadLocation);
    jetpack.dir(introspectionDir);
    jetpack.write(downloadLocation, schema);
    return relative(amplify.getEnvInfo().projectPath, downloadLocation);
  } catch (ex) {
    if (ex.code === 'NotFoundException') {
      throw new AmplifyCodeGenAPINotFoundError(constants.ERROR_APPSYNC_API_NOT_FOUND);
    }
    throw ex;
  }
}

module.exports = downloadIntrospectionSchema;
