const aws = require('./aws.js');

class AppSync {
  constructor(context, options = {}) {
    return aws.configureWithCreds(context).then((awsItem) => {
      this.context = context;
      this.appSync = new awsItem.AppSync(options);
      return this;
    });
  }
}

module.exports = AppSync;
