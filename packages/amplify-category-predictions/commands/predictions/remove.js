import { invokeS3GetResourceName, invokeS3GetUserInputs, invokeS3RemoveAdminLambdaTrigger } from '../../provider-utils/awscloudformation/prediction-category-walkthroughs/storage-api'
const subcommand = 'remove';
const category = 'predictions';
const { ResoureNotFoundError, exitOnNextTick } = require('amplify-cli-core');

async function removePredictionsS3Resources( context ){
  const s3ResourceName = await invokeS3GetResourceName(context);
  if (!s3ResourceName) {
    context.usageData.emitError(new ResoureNotFoundError('S3 Resource does not exist'));
    exitOnNextTick(0);
    return;
  }
  const s3UserInputs = await invokeS3GetUserInputs( context, s3ResourceName );
  if (!s3UserInputs) {
    context.usageData.emitError(new ResoureNotFoundError('S3 Resource not initialized correctly may require migration'));
    exitOnNextTick(0);
    return;
  }
  const adminTriggerFunction = (s3UserInputs.adminTriggerFunction)? s3UserInputs.adminTriggerFunction.triggerFunction:undefined;
  if (adminTriggerFunction) {
    await invokeS3RemoveAdminLambdaTrigger(context, s3ResourceName);
  }
}

async function removePredictionsResources(context){
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  const result = await amplify.removeResource(context, category, resourceName);
  try {
    await removePredictionsS3Resources(context);
  } catch (err){
    context.print.info(err.stack);
    context.print.error('An error occurred when removing the predictions resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
  return result;
}

module.exports = {
  name: subcommand,
  run: removePredictionsResources,
};
