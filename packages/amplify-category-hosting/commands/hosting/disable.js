const constants = require('../../lib/constants'); 

module.exports = {
    name: 'disable',
    alias: ['remove'],
    run: async (context) => {
        const { amplify } = context;
        return amplify.removeResource(context, 'hosting', 'default')
          .catch((err) => {
            context.print.info(err.stack);
            context.print.error('There was an error removing the hosting resource');
          });
    },
};
  