const codeGen = require('../../src');
const { exitOnNextTick } = require('amplify-cli-core');
const featureName = 'types';

module.exports = {
  name: featureName,
  run: async context => {
    try {
      const forceDownloadSchema = !context.parameters.options.nodownload;
      await codeGen.generateTypes(context, forceDownloadSchema);
    } catch (ex) {
      context.print.info(ex.message);
      await context.usageData.emitError(ex);
      exitOnNextTick(1);
    }
  },
};
