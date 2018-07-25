module.exports = {
  name: 'publish',
  run: async (context) => {
    context.exeInfo = context.amplify.getProjectDetails();
    const { amplifyMeta } = context.exeInfo;

    if (!amplifyMeta.hosting || Object.keys(amplifyMeta.hosting).length < 1) {
      context.print.info('');
      context.print.error('Please add hosting to your project before publishing your project');
      context.print.info('Command: amplify hosting add');
      context.print.info('');
      return;
    }

    await context.amplify.pushResources(context);

    const frontendHandler =
        require(Object.values(context.exeInfo.projectConfig.frontendHandler)[0]);
    frontendHandler.publish(context);
  },
};
