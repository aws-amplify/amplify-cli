const serverlessExpress = require('@vendia/serverless-express');
const app = require('./app');

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
exports.handler = async (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  return serverlessExpress({ app })(event, context);
};
