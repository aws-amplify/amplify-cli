const codeGen = require('../../src');
const { exitOnNextTick } = require('amplify-cli-core');
const featureName = 'models';

module.exports = {
  name: featureName,
  run: async context => {
    try {
      await codeGen.generateModels(context);
    } catch (ex) {
      context.print.info(ex.message);
      console.log(ex.stack);
      await context.usageData.emitError(ex);
      exitOnNextTick(1);
    }
  },
};
