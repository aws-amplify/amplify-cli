const aws = require('./aws.js');

class Lex {
  constructor(context) {
    return aws.configureWithCreds(context)
      .then((awsItem) => {
        this.context = context;
        this.lex = new awsItem.Lex();
        return this;
      });
  }
}

module.exports = Lex;
