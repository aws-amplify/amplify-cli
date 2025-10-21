const { AppSyncClient } = require('@aws-sdk/client-appsync');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const configurationManager = require('../configuration-manager');
const { proxyAgent } = require('./aws-globals');

class AppSync {
  constructor(context, options = {}) {
    return (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // could not load the creds
      }

      this.context = context;
      this.appSync = new AppSyncClient({
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

module.exports = AppSync;
