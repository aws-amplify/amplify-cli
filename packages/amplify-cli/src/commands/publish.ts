import { printer } from '@aws-amplify/amplify-prompts';
import { run as push } from './push';

/**
 * Entry point to amplify publish
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const run = async (context) => {
  context.amplify.constructExeInfo(context);
  const { amplifyMeta } = context.exeInfo;
  const isHostingAdded = amplifyMeta.hosting && Object.keys(amplifyMeta.hosting).length > 0;

  if (!isHostingAdded) {
    printer.blankLine();
    printer.error('Add hosting to your project before publishing your project');
    printer.info('Command: amplify hosting add');
    printer.blankLine();
    return;
  }

  let isHostingAlreadyPushed = false;
  Object.keys(amplifyMeta.hosting).every((hostingService) => {
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

  // added extra check for -y flag as in publish frontend deploy is getting stuck in CI/CD if backend has no changes

  let continueToPublish = didPush || !!context?.exeInfo?.inputParams?.yes;
  if (!continueToPublish && isHostingAlreadyPushed) {
    printer.info('');
    continueToPublish = await context.amplify.confirmPrompt('Do you still want to publish the frontend?');
  }

  if (continueToPublish) {
    const frontendPlugins = context.amplify.getFrontendPlugins(context);
    // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
    const frontendHandlerModule = require(frontendPlugins[context.exeInfo.projectConfig.frontend]);
    await frontendHandlerModule.publish(context);
  }
};
