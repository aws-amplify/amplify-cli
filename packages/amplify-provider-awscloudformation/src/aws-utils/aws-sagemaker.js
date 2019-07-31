const aws = require('./aws.js');
const configurationManager = require('../../lib/configuration-manager');

class SageMaker {
  constructor(context, options = {}) {
    return (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      this.context = context;
      this.sageMaker = new aws.SageMaker({ ...cred, ...options, apiVersion: '2017-07-24' });
      return this;
    })();
  }
}

module.exports = SageMaker;
