const featureName = 'configure';

module.exports = {
  name: featureName,
  alias: 'update',
  run: async (context) => {
    const codeGen = require('../../src/index');

    try {
      await codeGen.configure(context);
    } catch (ex) {
      context.print.error(ex.message);
    }
  },
};
