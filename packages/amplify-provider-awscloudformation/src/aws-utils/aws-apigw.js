const aws = require('./aws.js');

class APIGateway {
  constructor(context) {
    return aws.configureWithCreds(context).then((awsItem) => {
      this.context = context;
      this.apigw = new awsItem.APIGateway();
      return this;
    });
  }
}

module.exports = APIGateway;
