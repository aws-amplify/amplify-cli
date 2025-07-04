const aws = require('./aws.js');
const configurationManager = require('../configuration-manager');
const { proxyAgent } = require('./aws-globals');

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

      this.sageMaker = new aws.SageMaker({
        ...cred,
        ...options,
        apiVersion: '2017-07-24',
        httpOptions: {
          agent: proxyAgent(),
        },
      });
      return this;
    })();
  }
}

module.exports = SageMaker;
