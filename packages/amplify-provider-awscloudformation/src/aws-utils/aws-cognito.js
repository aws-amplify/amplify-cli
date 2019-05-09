const aws = require('./aws.js');

class Cognito {
  constructor(context, options = {}) {
    return (async () => {
      await aws.loadConfig(context);
      this.context = context;
      this.cognito = new aws.CognitoIdentityServiceProvider(options);
      return this;
    })();
  }
}

module.exports = Cognito;
