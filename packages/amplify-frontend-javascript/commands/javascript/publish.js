const publisher = require('../../lib/publisher'); 

module.exports = {
    name: 'publish',
    run: async (context) => {
        context.exeInfo = context.amplify.getProjectDetails();
        publisher.run(context);
    }
}
  