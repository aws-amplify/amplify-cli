const featureName = 'add';

module.exports = {
  name: featureName,
  run: async (context) => {
    const codeGen = require('../../src/index');
    try {
      const apiId = context.parameters.options.apiId || null;
      await codeGen.add(context, apiId);
    } catch (ex) {
      context.print.error(ex.message);
    }
  },
};
