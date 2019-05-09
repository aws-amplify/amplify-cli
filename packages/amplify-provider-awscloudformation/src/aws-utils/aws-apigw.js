const aws = require('./aws.js');

class APIGateway {
  constructor(context, options = {}) {
    return (async () => {
      await aws.loadConfig(context);
      this.context = context;
      this.apigw = new aws.APIGateway(options);
      return this;
    })();
  }
}

module.exports = APIGateway;
