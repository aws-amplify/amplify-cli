module.exports = {
  name: 'publish',
  run: async (context) => {
    context.amplify.constructExeInfo(context);
    const { amplifyMeta } = context.exeInfo;
    const isHostingAdded = amplifyMeta.hosting && Object.keys(amplifyMeta.hosting).length > 0;

    if (!isHostingAdded) {
      context.print.info('');
      context.print.error('Please add hosting to your project before publishing your project');
      context.print.info('Command: amplify hosting add');
      context.print.info('');
      return;
    }

    let isHostingAlreadyPushed = false;
    Object.keys(amplifyMeta.hosting).every((hostingService) => {
      let continueToCheckNext = true;
      if (amplifyMeta.hosting[hostingService].lastPushTimeStamp) {
        const lastPushTime = new Date(amplifyMeta.hosting[hostingService].lastPushTimeStamp);
        if (lastPushTime < Date.now()) {
          isHostingAlreadyPushed = true;
          continueToCheckNext = false;
        }
      }
      return continueToCheckNext;
    });

    const didPush = await context.amplify.pushResources(context);

    let continueToPublish = didPush;
    if (!continueToPublish && isHostingAlreadyPushed) {
      context.print.info('');
      continueToPublish = await context.amplify.confirmPrompt.run('Do you still want to publish the frontend?');
    }

    if (continueToPublish) {
      const frontendPlugins = context.amplify.getFrontendPlugins(context);
      const frontendHandlerModule =
        require(frontendPlugins[context.exeInfo.projectConfig.frontend]);
      frontendHandlerModule.publish(context);
    }
  },
};

