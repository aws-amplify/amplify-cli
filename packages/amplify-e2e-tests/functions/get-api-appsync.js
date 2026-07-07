// /* eslint-disable no-console */
const { AppSyncClient, GetGraphqlApiCommand } = require('@aws-sdk/client-appsync');

const getGqlApi = async (idKey) => {
  const appsync = new AppSyncClient({ region: process.env.REGION });
  return await appsync.send(new GetGraphqlApiCommand({ apiId: process.env[idKey] }));
};

exports.handler = async (event) => {
  return await getGqlApi(event.idKey);
};
