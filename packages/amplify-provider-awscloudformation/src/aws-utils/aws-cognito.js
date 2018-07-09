const aws = require('./aws.js');

class Cognito {
  constructor(context) {
    return aws.configureWithCreds(context)
      .then((awsItem) => {
        this.context = context;
        this.cognito = new awsItem.CognitoIdentityServiceProvider();
        return this;
      });
  }
}

module.exports = Cognito;
