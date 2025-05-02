const aws = require('./aws.js');
const configurationManager = require('../configuration-manager');
const { proxyAgent } = require('./aws-globals.js');

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
      this.appSync = new aws.AppSync({
        ...cred,
        ...options,
        httpOptions: {
          agent: proxyAgent(),
        },
      });
      return this;
    })();
  }
}

module.exports = AppSync;
