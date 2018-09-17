const codeGen = require('../../src/index');

const featureName = 'add';

module.exports = {
  name: featureName,
  run: async (context) => {
    try {
      const apiId = context.parameters.options.apiId || null;
      await codeGen.add(context, apiId);
    } catch (ex) {
      context.print.error(ex.message);
    }
  },
};
