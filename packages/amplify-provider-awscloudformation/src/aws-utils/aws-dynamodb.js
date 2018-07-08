const aws = require('./aws.js');

class DynamoDB {
  constructor(context) {
    return aws.configureWithCreds(context)
      .then((awsItem) => {
        this.context = context;
        this.dynamodb = new awsItem.DynamoDB();
        return this;
      });
  }
}

module.exports = DynamoDB;
