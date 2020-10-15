const aws = require('./aws.js');
const configurationManager = require('../configuration-manager');

class CognitoIdentity {
  constructor(context, options = {}) {
    return (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // could not load cred
      }
      this.context = context;
      this.cognito = new aws.CognitoIdentity({ ...cred, ...options });
      return this;
    })();
  }
}

module.exports = CognitoIdentity;
