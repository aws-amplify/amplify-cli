// /* eslint-disable no-console */
const AWS = require('aws-sdk');

const getGqlApi = async (idKey) => {
  const appsync = new AWS.AppSync({ region: process.env.REGION });
  return await appsync.getGraphqlApi({ apiId: process.env[idKey] }).promise();
}

exports.handler = async (event) => {
  return await getGqlApi(event.idKey);
};
