const aws = require('./aws.js');
const configurationManager = require('../../lib/configuration-manager');

class Cognito {
  constructor(context, options = {}) {
    return (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // could not load cred
      }
      this.context = context;
      this.cognito = new aws.CognitoIdentityServiceProvider({ ...cred, ...options });
      return this;
    })();
  }
}

module.exports = Cognito;
