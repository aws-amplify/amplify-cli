const aws = require('./aws.js');
const configurationManager = require('../../lib/configuration-manager');

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
      this.dynamodb = new aws.DynamoDB({ ...cred, ...options });
      return this;
    })();
  }
}

module.exports = DynamoDB;
