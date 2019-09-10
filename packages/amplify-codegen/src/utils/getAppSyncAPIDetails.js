const getAppSyncAPIs = require('./getAppSyncAPIs');

function getAppSyncAPIDetails(context) {
  const meta = context.amplify.getProjectMeta();
  const appSyncAPIs = getAppSyncAPIs(meta.api);
  if (!appSyncAPIs.length) {
    return [];
  }
  return appSyncAPIs.map(api => ({
    name: api.name,
    endpoint: api.output.GraphQLAPIEndpointOutput,
    id: api.output.GraphQLAPIIdOutput,
    authConfig: api.output.authConfig,
  }));
}

module.exports = getAppSyncAPIDetails;
