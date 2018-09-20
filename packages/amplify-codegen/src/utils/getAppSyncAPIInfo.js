async function getAppSyncAPIInfo(context, apiId) {
  const { amplify } = context;
  const { graphqlApi } = await amplify.executeProviderUtils(
    context,
    'awscloudformation',
    'getGraphQLApiDetails',
    {
      apiId,
    },
  );
  return {
    id: graphqlApi.apiId,
    endpoint: graphqlApi.uris.GRAPHQL,
    name: graphqlApi.name,
  };
}

module.exports = getAppSyncAPIInfo;
