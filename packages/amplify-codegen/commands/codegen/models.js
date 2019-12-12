const codeGen = require('../../src');

const featureName = 'models';

module.exports = {
  name: featureName,
  run: async context => {
    try {
      await codeGen.generateModels(context);
    } catch (ex) {
      context.print.info(ex.message);
      console.log(ex.stack);
      process.exit(1);
    }
  },
};
