const { SageMakerClient } = require('@aws-sdk/client-sagemaker');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
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

      this.sageMaker = new SageMakerClient({
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

module.exports = SageMaker;
