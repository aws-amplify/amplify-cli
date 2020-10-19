const aws = require('./aws.js');
const { CreateService } = require('./aws-service-creator');

class SageMaker {
  constructor(context, options = {}) {
    return (async () => {
      this.context = context;
      this.sageMaker = await CreateService(context, aws.SageMaker, { ...options, apiVersion: '2017-07-24' });
      return this;
    })();
  }
}

module.exports = SageMaker;
