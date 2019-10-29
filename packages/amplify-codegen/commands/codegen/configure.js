const codeGen = require('../../src/index');

const featureName = 'configure';

module.exports = {
  name: featureName,
  alias: 'update',
  run: async context => {
    try {
      await codeGen.configure(context);
    } catch (ex) {
      context.print.error(ex.message);
    }
  },
};
