const fs = require('fs-extra');
const { dirname, relative } = require('path');

const { AmplifyCodeGenAPINotFoundError } = require('../errors');
const constants = require('../constants');

async function downloadIntrospectionSchema(context, apiId, downloadLocation, region) {
  const { amplify } = context;

  if (!downloadLocation.endsWith('.graphql')) {
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
      fs.ensureDirSync(introspectionDir);
      fs.writeFileSync(downloadLocation, schema, 'utf8');
      if (!context.withoutInit) {
        return relative(amplify.getEnvInfo().projectPath, downloadLocation);
      }
      return relative(process.cwd(), downloadLocation);
    } catch (ex) {
      if (ex.code === 'NotFoundException') {
        throw new AmplifyCodeGenAPINotFoundError(constants.ERROR_APPSYNC_API_NOT_FOUND);
      }
      throw ex;
    }
  }
  return downloadLocation;
}

module.exports = downloadIntrospectionSchema;
