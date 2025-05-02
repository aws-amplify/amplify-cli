// @ts-check
const aws = require('./aws.js');
const configurationManager = require('../configuration-manager');
const { proxyAgent } = require('./aws-globals.js');

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

      /** @type {AWS.SecretsManager} */
      this.secretsManager = new aws.SecretsManager({
        ...cred,
        ...options,
        httpOptions: {
          agent: proxyAgent(),
        },
      });

      return this;
    })();

    return instancePromise;
  }
}

module.exports = SecretsManager;
