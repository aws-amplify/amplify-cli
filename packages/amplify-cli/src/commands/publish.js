module.exports = {
    name: 'publish',
    run: async (context) => {
        context.exeInfo = context.amplify.getProjectDetails();
        await context.amplify.pushResources(context);
        const frontendHandler = require(Object.values(context.exeInfo.projectConfig.frontendHandler)[0]);
        frontendHandler.publish(context); 
    },
};
  