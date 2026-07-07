const { TransformerPluginBase } = require('@aws-amplify/graphql-transformer-core');

class SimpleCustomTransformer extends TransformerPluginBase {
  constructor() {
    super('simple-custom-transformer', 'directive @simple on OBJECT');
  }

  // Must be implemented.
  object() {
    // empty
  }
}

module.exports = { default: SimpleCustomTransformer };
