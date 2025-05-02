const aws = require('./aws.js');
const configurationManager = require('../configuration-manager');
const { proxyAgent } = require('./aws-globals.js');

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

      this.dynamodb = new aws.DynamoDB({
        ...cred,
        ...options,
        httpOptions: {
          agent: proxyAgent(),
        },
      });
      return this;
    })();
  }
}

module.exports = DynamoDB;
