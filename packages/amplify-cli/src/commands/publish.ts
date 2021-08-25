import { run as push } from './push';
import { FrontendBuildError } from 'amplify-cli-core';
import { hasCdBranches } from '../utils/check-hosting';

export const run = async context => {
  context.amplify.constructExeInfo(context);
  const { amplifyMeta } = context.exeInfo;
  const isHostingAdded = amplifyMeta.hosting && Object.keys(amplifyMeta.hosting).length > 0;

  // Stop if the user has Continuous Deployment set up in the Amplify Console.
  if (await hasCdBranches(context)) {
    context.print.info('');
    context.print.error(
      'You have already connected branches to your Amplify Console app. Please visit the Amplify Console to manage your branches.',
    );
    context.print.info('');
    return;
    // Otherwise, stop if the user has not added the hosting category.
  } else if (!isHostingAdded) {
    context.print.info('');
    context.print.error('Please add hosting to your project before publishing your project');
    context.print.info('Command: amplify hosting add');
    context.print.info('');
    return;
  }

  let isHostingAlreadyPushed = false;
  Object.keys(amplifyMeta.hosting).every(hostingService => {
    let continueToCheckNext = true;
    if (amplifyMeta.hosting[hostingService].lastPushTimeStamp) {
      const lastPushTime = new Date(amplifyMeta.hosting[hostingService].lastPushTimeStamp).getTime();
      if (lastPushTime < Date.now()) {
        isHostingAlreadyPushed = true;
        continueToCheckNext = false;
      }
    }
    return continueToCheckNext;
  });

  const didPush = await push(context);

  let continueToPublish = didPush;
  if (!continueToPublish && isHostingAlreadyPushed) {
    context.print.info('');
    continueToPublish = await context.amplify.confirmPrompt('Do you still want to publish the frontend?');
  }

  try {
    if (continueToPublish) {
      const frontendPlugins = context.amplify.getFrontendPlugins(context);
      const frontendHandlerModule = require(frontendPlugins[context.exeInfo.projectConfig.frontend]);
      await frontendHandlerModule.publish(context);
    }
  } catch (e) {
    context.print.error(`An error occurred during the publish operation: ${e.message || 'Unknown error occurred.'}`);
    await context.usageData.emitError(new FrontendBuildError(e.message));
    process.exit(1);
  }
};
