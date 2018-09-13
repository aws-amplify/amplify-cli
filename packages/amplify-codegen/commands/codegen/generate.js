const codeGen = require('../../src/index');

const featureName = 'generate';

module.exports = {
  name: featureName,
  run: async (context) => {
    try {
      const forceDownloadSchema = context.parameters.options.download || false;
      await codeGen.generate(context, forceDownloadSchema);
    } catch (ex) {
      context.print.info(ex.message);
      process.exit(1);
    }
  },
};
