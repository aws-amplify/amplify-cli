import { createServer, proxy } from 'aws-serverless-express';
import { app } from './app.js';

/**
 * @type {import('http').Server}
 */
const server = createServer(app);

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = (event, context) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  return proxy(server, event, context, 'PROMISE').promise;
};
