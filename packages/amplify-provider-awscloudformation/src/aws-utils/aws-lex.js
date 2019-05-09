const aws = require('./aws.js');

class Lex {
  constructor(context, options = {}) {
    return (async () => {
      await aws.loadConfig(context);
      this.context = context;
      this.lex = new aws.LexModelBuildingService({ ...options, apiVersion: '2017-04-19' });
      return this;
    })();
  }
}

module.exports = Lex;
