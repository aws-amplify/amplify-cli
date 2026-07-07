const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const configurationManager = require('../configuration-manager');
const { proxyAgent } = require('./aws-globals');

class DynamoDB {
  constructor(context, options = {}) {
    return (async () => {
      let cred;
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // ignore errors
      }
      this.context = context;

      this.dynamodb = new DynamoDBClient({
        ...cred,
        ...options,
        requestHandler: new NodeHttpHandler({
          httpAgent: proxyAgent(),
          httpsAgent: proxyAgent(),
        }),
      });
      return this;
    })();
  }
}

module.exports = DynamoDB;
