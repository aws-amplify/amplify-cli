const aws = require('./aws.js');

class Lambda {
  constructor(context) {
    return aws.configureWithCreds(context)
      .then((awsItem) => {
        this.context = context;
        this.lambda = new awsItem.Lambda();
        return this;
      });
  }
}

module.exports = Lambda;
