const codeGen = require('../../src');

const featureName = 'generate-docs';

module.exports = {
  name: featureName,
  run: async (context) => {
    try {
      const forceDownloadSchema = context.parameters.options.download || false;
      await codeGen.generateDocs(context, forceDownloadSchema);
    } catch (ex) {
      context.print.info(ex);
      process.exit(1);
    }
  },
};
