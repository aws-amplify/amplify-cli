const { TransformerPluginBase } = require('@aws-amplify/graphql-transformer-core');

class SimpleCustomTransformer extends TransformerPluginBase {
  constructor() {
    super('simple-custom-transformer', 'directive @simple on OBJECT');
  }

  object() {} // Must be implemented.
}

module.exports = { default: SimpleCustomTransformer };
