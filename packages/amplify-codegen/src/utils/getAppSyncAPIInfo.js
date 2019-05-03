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

    const additionalAuthenticationProviders = (graphqlApi.additionalAuthenticationProviders || [])
      .map(provider => provider.authenticationType)
      .filter(t => !!t);

    if ([...additionalAuthenticationProviders, graphqlApi.authenticationType].includes('API_KEY')) {
      apiKeys = await getAPIKeys(context, apiId, region);
    }

    return {
      id: graphqlApi.apiId,
      endpoint: graphqlApi.uris.GRAPHQL,
      name: graphqlApi.name,
      securityType: graphqlApi.authenticationType,
      additionalAuthenticationProviders,
      apiKeys,
      region, // region override for externally added API
    };
  } catch (e) {
    if (e.code === 'NotFoundException') {
      throw new AmplifyCodeGenAPINotFoundError(constants.ERROR_APPSYNC_API_NOT_FOUND);
    }
    throw e;
  }
}

async function getAPIKeys(context, apiId, region) {
  const { amplify } = context;
  const result = await amplify.executeProviderUtils(
    context,
    'awscloudformation',
    'getAppSyncApiKeys',
    {
      apiId,
      region,
    },
  );
  const { apiKeys = [] } = result;
  return apiKeys;
}

module.exports = getAppSyncAPIInfo;
