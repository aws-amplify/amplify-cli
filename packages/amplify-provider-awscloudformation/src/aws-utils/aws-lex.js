const aws = require('./aws.js');
const configurationManager = require('../../lib/configuration-manager');

class Lex {
  constructor(context, options = {}) {
    return (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      this.context = context;
      this.lex = new aws.LexModelBuildingService({ ...cred, ...options, apiVersion: '2017-04-19' });
      return this;
    })();
  }
}

module.exports = Lex;
