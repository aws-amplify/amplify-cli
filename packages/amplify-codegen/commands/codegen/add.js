const codeGen = require('../../src/index');
const constants = require('../../src/constants');

const featureName = 'add';

module.exports = {
  name: featureName,
  run: async context => {
    try {
      const { options = {} } = context.parameters;
      const keys = Object.keys(options);
      if (keys.length && !keys.includes('apiId')) {
        const paramMsg = keys.length > 1 ? 'Invalid parameters ' : 'Invalid parameter ';
        context.print.info(`${paramMsg} ${keys.join(', ')}`);
        context.print.info(constants.INFO_MESSAGE_ADD_ERROR);
        return;
      }
      const apiId = context.parameters.options.apiId || null;
      await codeGen.add(context, apiId);
    } catch (ex) {
      context.print.error(ex.message);
    }
  },
};
