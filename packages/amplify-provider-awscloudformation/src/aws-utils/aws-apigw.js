const aws = require('./aws.js');
const configurationManager = require('../../lib/configuration-manager');

class APIGateway {
  constructor(context, options = {}) {
    return (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // nothing
      }
      this.context = context;
      this.apigw = new aws.APIGateway({ ...cred, ...options });
      return this;
    })();
  }
}

module.exports = APIGateway;
