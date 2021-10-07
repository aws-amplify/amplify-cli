import { $TSContext } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { uploadFiles } from '../../provider-utils/awscloudformation/utils/trigger-file-uploader';

export const name = 'push';
const category = 'auth';

export const run = async (context: $TSContext) => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  context.amplify.constructExeInfo(context);
  try {
    const result = await amplify.pushResources(context, category, resourceName);
    await uploadFiles(context);
    return result;
  } catch (err) {
    printer.info(err.stack);
    printer.error('There was an error pushing the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
