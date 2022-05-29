/**
 * wrapper functions to invoke functions exported by
 * storage category. (primarily s3 api used by predictions for identity)
 * @param {*} context
 */
import * as uuid from 'uuid';

/**
 * @returns Name of S3 resource or undefined
 */
export async function invokeS3GetResourceName(context) {
  const s3ResourceName = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetResourceName', [context]);
  return s3ResourceName;
}

/**
 * Return the cli-inputs.json
 * @param context
 * @param s3ResourceName
 * @returns
 */
export async function invokeS3GetUserInputs(context, s3ResourceName) {
  const s3UserInputs = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetUserInput', [context, s3ResourceName]);
  return s3UserInputs;
}

/**
 * Get all default user inputs for S3
 * @param context
 * @param storageInput - Storage + Auth configurations as required by the calling category
 * @returns Storage User Input
 */
export async function invokeS3GetAllDefaults(context, s3AccessType) {
  const project = context.amplify.getProjectDetails();
  const [shortId] = uuid.v4().split('-');
  const s3DefaultUserInput = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3GetBucketUserInputDefault', [
    project,
    shortId,
    s3AccessType,
  ]);
  return s3DefaultUserInput;
}

/**
 * Create new lambda and add as Storage Lambda trigger
 * @param context
 * @param s3ResourceName
 * @param storageLambdaTrigger
 * @returns
 */
export async function invokeS3AddStorageLambdaTrigger(context, s3ResourceName, S3UserInputTriggerFunctionParams) {
  const s3UserInputs = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3AddStorageLambdaTrigger', [
    context,
    s3ResourceName,
    S3UserInputTriggerFunctionParams,
  ]);
  return s3UserInputs;
}

/**
 * Remove Admin Lambda for Predictions category (Rekognition)
 * @param context
 * @param s3ResourceName
 * @param adminLambdaTrigger
 * @returns
 */
export async function invokeS3RemoveAdminLambdaTrigger(context, s3ResourceName) {
  const s3UserInputs = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3RemoveAdminLambdaTrigger', [
    context,
    s3ResourceName,
  ]);
  return s3UserInputs;
}

/**
 * Add existing (Non Storage) Lambda Trigger as Admin for Predictions category (Rekognition)
 * note:- (legacy logic, should be moved to addLambdaTrigger -  to support multiple lambda triggers)
 * @param context
 * @param s3ResourceName
 * @param adminLambdaTrigger
 * @returns
 */
export async function invokeS3RegisterAdminTrigger(context, s3ResourceName, adminLambdaTrigger) {
  const s3UserInputs = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3RegisterAdminTrigger', [
    context,
    s3ResourceName,
    adminLambdaTrigger,
  ]);
  return s3UserInputs;
}

/**
 * Allow other services to create the storage resource. (Currently used by Predictions category)
 * @param context
 * @param storageInput - Storage + Auth configurations as required by the calling category
 * @returns Name of the storage resource.
 */
export async function invokeS3AddResource(context, storageUserInput) {
  const storageResourceName = await context.amplify.invokePluginMethod(context, 'storage', undefined, 's3CreateStorageResource', [
    context,
    storageUserInput,
  ]);
  return storageResourceName;
}
