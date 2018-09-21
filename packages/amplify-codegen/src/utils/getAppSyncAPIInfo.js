const { AmplifyCodeGenAPINotFoundError } = require('../errors');
const constants = require('../constants');

async function getAppSyncAPIInfo(context, apiId, region) {
  const { amplify } = context;
  try {
    const { graphqlApi } = await amplify.executeProviderUtils(
      context,
      'awscloudformation',
      'getGraphQLApiDetails',
      {
        apiId,
        region,
      },
    );
    return {
      id: graphqlApi.apiId,
      endpoint: graphqlApi.uris.GRAPHQL,
      name: graphqlApi.name,
    };
  } catch (e) {
    if (e.code === 'NotFoundException') {
      throw new AmplifyCodeGenAPINotFoundError(constants.ERROR_APPSYNC_API_NOT_FOUND);
    }
    throw e;
  }
}

module.exports = getAppSyncAPIInfo;
