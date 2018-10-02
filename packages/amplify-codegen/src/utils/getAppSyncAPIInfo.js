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

    let apiKeys;

    if (graphqlApi.authenticationType === 'API_KEY') {
      apiKeys = await amplify.executeProviderUtils(
        context,
        'awscloudformation',
        'getAppSyncApiKeys',
        {
          apiId,
          region,
        },
      );
    }

    return {
      id: graphqlApi.apiId,
      endpoint: graphqlApi.uris.GRAPHQL,
      name: graphqlApi.name,
      securityType: graphqlApi.authenticationType,
      apiKeys,
    };
  } catch (e) {
    if (e.code === 'NotFoundException') {
      throw new AmplifyCodeGenAPINotFoundError(constants.ERROR_APPSYNC_API_NOT_FOUND);
    }
    throw e;
  }
}

module.exports = getAppSyncAPIInfo;
