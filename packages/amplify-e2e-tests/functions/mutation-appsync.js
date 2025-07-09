/* eslint-disable no-console */
require('isomorphic-fetch');
const AWS = require('aws-sdk');
const AWSAppSyncClient = require('aws-appsync').default;
const { AUTH_TYPE } = require('aws-appsync');
const gql = require('graphql-tag');

const runGQLMutation = async (gql_url, mutation, variables) => {
  const client = new AWSAppSyncClient({
    url: process.env[gql_url],
    region: process.env.REGION,
    auth: {
      type: AUTH_TYPE.AWS_IAM,
      credentials: AWS.config.credentials,
    },
    disableOffline: true,
  });
  return await client.mutate({ mutation: gql(mutation), variables });
};

exports.handler = async (event) => {
  return await runGQLMutation(event.urlKey, event.mutation, event.variables);
};
