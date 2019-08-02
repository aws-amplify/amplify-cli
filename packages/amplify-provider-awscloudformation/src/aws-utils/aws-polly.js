const aws = require('./aws.js');
const configurationManager = require('../../lib/configuration-manager');

class Polly {
  constructor(context, options = {}) {
    return (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      this.context = context;
      this.polly = new aws.Polly({ ...cred, ...options, apiVersion: '2016-06-10' });
      return this;
    })();
  }
}

module.exports = Polly;
