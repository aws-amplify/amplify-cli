const aws = require('./aws.js');
const { CreateService } = require('./aws-service-creator');
const serviceRegionMap = {
  'us-east-1': 'us-east-1',
  'us-east-2': 'us-east-1',
  'sa-east-1': 'us-east-1',
  'ca-central-1': 'us-east-1',
  'us-west-1': 'us-west-2',
  'us-west-2': 'us-west-2',
  'cn-north-1': 'us-west-2',
  'cn-northwest-1': 'us-west-2',
  'ap-south-1': 'us-west-2',
  'ap-northeast-3': 'us-west-2',
  'ap-northeast-2': 'us-west-2',
  'ap-southeast-1': 'ap-southeast-1',
  'ap-southeast-2': 'ap-southeast-2',
  'ap-northeast-1': 'ap-northeast-1',
  'eu-central-1': 'eu-central-1',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-2',
  'eu-west-3': 'eu-west-1',
};

class Lex {
  constructor(context, options = {}) {
    return (async () => {
      this.context = context;
      //this.lex = new aws.LexModelBuildingService({ ...options, apiVersion: '2017-04-19' });
      this.lex = await CreateService(context, aws.LexModelBuildingService, { ...options, apiVersion: '2017-04-19' });
      return this;
    })();
  }
}
function getLexRegionMapping() {
  return serviceRegionMap;
}

module.exports = { Lex, getLexRegionMapping };
