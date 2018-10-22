const aws = require('./aws.js');

class Lex {
  constructor(context) {
    return aws.configureWithCreds(context)
      .then((awsItem) => {
        this.context = context;
        this.lex = new awsItem.LexModelBuildingService({ apiVersion: '2017-04-19' });
        return this;
      });
  }
}

module.exports = Lex;
