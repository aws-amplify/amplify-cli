const { initializeEnv } = require('../../lib/initialize-env');

module.exports = {
  name: 'pull',
  run: async context => {
    context.amplify.constructExeInfo(context);
    context.exeInfo.forcePush = false;
    context.exeInfo.restoreBackend = context.parameters.options.restore;
    await initializeEnv(context);
  },
};
