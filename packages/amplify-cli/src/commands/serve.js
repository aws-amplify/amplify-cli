module.exports = {
    name: 'serve',
    run: async (context) => {
        context.exeInfo = context.amplify.getProjectDetails();
        await context.amplify.pushResources(context);
        const frontendHandler = require(context.exeInfo.projectConfig.frontendHandler.values[0]);
        frontendHandler.serve(context); 
    },
};
  