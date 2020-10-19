const aws = require('./aws.js');
const { CreateService } = require('./aws-service-creator');

class Lambda {
  constructor(context, options = {}) {
    return (async () => {
      this.context = context;
      this.lambda = await CreateService(context, aws.Lambda, options);
      return this;
    })();
  }
}

module.exports = Lambda;
