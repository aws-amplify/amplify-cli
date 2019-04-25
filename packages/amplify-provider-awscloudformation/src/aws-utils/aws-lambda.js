const aws = require('./aws.js');
const configurationManager = require('../../lib/configuration-manager');

class Lambda {
  constructor(context, options = {}) {
    return (async () => {
      let cred;
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      this.context = context;
      this.lambda = new aws.Lambda({ ...cred, ...options });
      return this;
    })();
  }
}

module.exports = Lambda;
