const server = require('../../lib/server'); 

module.exports = {
    name: 'serve',
    run: async (context) => {
        context.exeInfo = context.amplify.getProjectDetails();
        server.run(context);
    }
}
  