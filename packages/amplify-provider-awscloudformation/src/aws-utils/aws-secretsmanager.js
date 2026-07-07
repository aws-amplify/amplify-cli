// @ts-check
const { SecretsManagerClient } = require('@aws-sdk/client-secrets-manager');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const configurationManager = require('../configuration-manager');
const { proxyAgent } = require('./aws-globals');

class SecretsManager {
  constructor(context, options = {}) {
    /** @type {any} */
    const instancePromise = (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      this.context = context;

      /** @type {SecretsManagerClient} */
      this.secretsManager = new SecretsManagerClient({
        ...cred,
        ...options,
        requestHandler: new NodeHttpHandler({
          httpAgent: proxyAgent(),
          httpsAgent: proxyAgent(),
        }),
      });

      return this;
    })();

    return instancePromise;
  }
}

module.exports = SecretsManager;
