const aws = require('./aws.js');

class DynamoDB {
  constructor(context, options = {}) {
    return (async () => {
      await aws.loadConfig(context);
      this.context = context;
      this.dynamodb = new aws.DynamoDB(options);
      return this;
    })();
  }
}

module.exports = DynamoDB;
