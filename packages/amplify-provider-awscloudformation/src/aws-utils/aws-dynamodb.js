const aws = require('./aws.js');
const { CreateService } = require('./aws-service-creator');

class DynamoDB {
  constructor(context, options = {}) {
    return (async () => {
      this.context = context;
      this.dynamodb = await CreateService(context, aws.DynamoDB, options);
      return this;
    })();
  }
}

module.exports = DynamoDB;
