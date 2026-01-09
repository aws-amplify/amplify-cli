const { LexModelBuildingServiceClient } = require('@aws-sdk/client-lex-model-building-service');
const { NodeHttpHandler } = require('@smithy/node-http-handler');
const configurationManager = require('../configuration-manager');
const { proxyAgent } = require('./aws-globals');

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
  'eu-north-1': 'eu-central-1',
  'eu-south-1': 'eu-central-1',
  'eu-west-1': 'eu-west-1',
  'eu-west-2': 'eu-west-2',
  'eu-west-3': 'eu-west-1',
  'me-south-1': 'ap-south-1',
};

class Lex {
  constructor(context, options = {}) {
    return (async () => {
      let cred = {};
      try {
        cred = await configurationManager.loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      this.context = context;
      this.lex = new LexModelBuildingServiceClient({
        ...cred,
        ...options,
        requestHandler: new NodeHttpHandler({
          httpAgent: proxyAgent(),
          httpsAgent: proxyAgent(),
        }),
      });
      return this;
    })();
  }
}
function getLexRegionMapping() {
  return serviceRegionMap;
}

module.exports = { Lex, getLexRegionMapping };
