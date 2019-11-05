const { initializeEnv } = require('../lib/initialize-env');

module.exports = {
  name: 'push',
  run: async context => {
    try {

      context.amplify.constructExeInfo(context);
      context.exeInfo.forcePush = false;
      context.exeInfo.restoreBackend = false;
      //The following line of code pulls the latest backend to #current-cloud-backend
      //so the amplify status is correctly shown to the user before the user confirms 
      //to push his local developments
      await initializeEnv(context); 

      await context.amplify.pushResources(context);
    } catch (e) {
      if (e.name !== 'InvalidDirectiveError') {
        context.print.error(`An error occured during the push operation: ${e.message}`);
      }
      process.exit(1);
    }
  },
};
