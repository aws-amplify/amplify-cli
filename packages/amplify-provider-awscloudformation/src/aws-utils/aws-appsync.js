const aws = require('./aws.js');

class AppSync {
  constructor(context, options = {}) {
    return (async () => {
      await aws.loadConfig(context);
      this.context = context;
      this.appSync = new aws.AppSync(options);
      return this;
    })();
  }
}

module.exports = AppSync;
