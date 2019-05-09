const aws = require('./aws.js');

class Lambda {
  constructor(context, options = {}) {
    return (async () => {
      await aws.loadConfig(context);
      this.context = context;
      this.lambda = new aws.Lambda(options);
      return this;
    })();
  }
}

module.exports = Lambda;
