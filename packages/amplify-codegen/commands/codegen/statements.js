const codeGen = require('../../src');

const featureName = 'statements';

module.exports = {
  name: featureName,
  run: async context => {
    try {
      const forceDownloadSchema = !context.parameters.options.nodownload;
      const { maxDepth } = context.parameters.options;
      await codeGen.generateStatements(context, forceDownloadSchema, maxDepth);
    } catch (ex) {
      context.print.info(ex.message);
      process.exit(1);
    }
  },
};
