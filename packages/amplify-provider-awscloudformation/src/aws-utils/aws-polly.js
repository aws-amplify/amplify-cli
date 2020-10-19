const aws = require('./aws.js');
const { CreateService } = require('./aws-service-creator');
class Polly {
  constructor(context, options = {}) {
    return (async () => {
      this.polly = await CreateService(context, aws.Polly, { ...options, apiVersion: '2016-06-10' });
      return this;
    })();
  }
}

module.exports = Polly;
