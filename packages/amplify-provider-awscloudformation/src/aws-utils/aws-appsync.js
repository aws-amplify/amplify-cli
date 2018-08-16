const aws = require('./aws.js');

class AppSync {
  constructor(context) {
    return aws.configureWithCreds(context).then((awsItem) => {
      this.context = context;
      this.appSync = new awsItem.AppSync();
      return this;
    });
  }
}

module.exports = AppSync;
