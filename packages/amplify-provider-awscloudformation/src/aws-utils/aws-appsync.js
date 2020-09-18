const aws = require('./aws.js');
const { CreateService } = require('./aws-service-creator');

class AppSync {
  constructor(context, options = {}) {
    return (async () => {
      this.appSync = await CreateService(context, aws.AppSync, options);
      return this;
    })();
  }
}

module.exports = AppSync;
