import { FrontendBuildError } from 'amplify-cli-core';
import { run as push } from './push';
import { showTroubleshootingURL } from './help';

/**
 * Entry point to amplify publish
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const run = async context => {
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

  // added extra check for -y flag as in publish frontend deploy is getting stuck in CICD if backend has no changes

  let continueToPublish = didPush || !!context?.exeInfo?.inputParams?.yes;
  if (!continueToPublish && isHostingAlreadyPushed) {
    context.print.info('');
    continueToPublish = await context.amplify.confirmPrompt('Do you still want to publish the frontend?');
  }

  try {
    if (continueToPublish) {
      const frontendPlugins = context.amplify.getFrontendPlugins(context);
      // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
      const frontendHandlerModule = require(frontendPlugins[context.exeInfo.projectConfig.frontend]);
      await frontendHandlerModule.publish(context);
    }
  } catch (e) {
    context.print.error(`An error occurred during the publish operation: ${e.message || 'Unknown error occurred.'}`);
    await context.usageData.emitError(new FrontendBuildError(e.message));
    showTroubleshootingURL();
    process.exit(1);
  }
};
