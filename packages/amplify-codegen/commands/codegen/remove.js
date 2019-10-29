const codeGen = require('../../src/index');

const featureName = 'remove';

module.exports = {
  name: featureName,
  run: async context => {
    try {
      await codeGen.remove(context);
    } catch (ex) {
      context.print.error(ex.message);
    }
  },
};
