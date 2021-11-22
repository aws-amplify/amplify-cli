// This is sample code. Please update this to suite your schema

exports.handler = async (event) => {
  console.log(`event >`, JSON.stringify(event, null, 2));
  const {
    authorizationToken,
    requestContext: { apiId, accountId },
  } = event;
  const response = {
    isAuthorized: authorizationToken === 'custom-authorized',
    resolverContext: {
      userid: 'user-id',
      info: 'contextual information A',
      more_info: 'contextual information B',
    },
    deniedFields: [
      `arn:aws:appsync:${process.env.AWS_REGION}:${accountId}:apis/${apiId}/types/Event/fields/comments`,
      `Mutation.createEvent`,
    ],
    ttlOverride: 300,
  };
  console.log(`response >`, JSON.stringify(response, null, 2));
  return response;
};

