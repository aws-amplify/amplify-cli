const { run } = require('../init');
const { multiEnvironmentSupportAvailable } = require('../../extensions/amplify-helpers/multi-env-checker');

const initRun = run;

module.exports = {
  name: 'add',
  run: async (context) => {
    if (!multiEnvironmentSupportAvailable(context)) {
      context.print.info('');
      context.print.error('Unfortunately, multiple environment support is not available for imported moible hub projects.');
      return;
    }
    initRun(context);
  },
};
