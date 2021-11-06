import { $TSContext, AmplifyCategories, AmplifySupportedService, CLISubCommandType, stateManager } from 'amplify-cli-core';
import { AmplifyS3ResourceStackTransform } from '../cdk-stack-builder/s3-stack-transform';
import { S3UserInputTriggerFunctionParams, S3UserInputs } from '../service-walkthrough-types/s3-user-input-types';
import { S3InputState } from './s3-user-input-state';
import { createNewLambdaAndUpdateCFN, migrateStorageCategory, isMigrateStorageRequired } from './s3-walkthrough';

/**
 * @returns Name of S3 resource or undefined
 */
export function s3GetResourceName(): string | undefined {
  const amplifyMeta = stateManager.getMeta();
  let resourceName = undefined;
  if (amplifyMeta[AmplifyCategories.STORAGE]) {
    const categoryResources = amplifyMeta[AmplifyCategories.STORAGE];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === AmplifySupportedService.S3) {
        resourceName = resource;
      }
    });
  }
  return resourceName;
}

/**
 * Return the cli-inputs.json
 * @param context
 * @param s3ResourceName
 * @returns
 */
export async function s3GetUserInput(context: $TSContext, s3ResourceName: string): Promise<S3UserInputs> {
  //migrate storage and fetch cliInputsState
  if ( isMigrateStorageRequired(context, s3ResourceName) ){
    await migrateStorageCategory(context, s3ResourceName);
  }
  let cliInputsState = new S3InputState(s3ResourceName as string, undefined);
  return cliInputsState.getUserInput();
}

/**
 * Get the name of the AdminTrigger function registered by predictions category
 * @param context
 * @returns triggerFunction name or undefined
 */
export async function s3GetAdminTriggerFunctionName(context: $TSContext) : Promise<string | undefined> {
  const s3ResourceName : string|undefined = await s3GetResourceName();
  const s3UserInput :S3UserInputs | undefined =  (s3ResourceName)?await s3GetUserInput(context , s3ResourceName ):undefined;
  return s3UserInput?.adminTriggerFunction?.triggerFunction;
}

/**
 * Update the cli-inputs.json
 * @param context
 * @param s3ResourceName
 * @returns
 */
 export async function s3UpdateUserInput(context: $TSContext, storageInput: S3UserInputs): Promise<S3UserInputs> {
  await s3APIHelperTransformAndSaveState(context, storageInput, CLISubCommandType.UPDATE);
  return storageInput;
}

/**
 * Allow other services to create the storage resource. (Currently used by Predictions category)
 * @param context
 * @param storageInput - Storage + Auth configurations as required by the calling category
 * @returns Name of the storage resource.
 */
export async function s3CreateStorageResource(context: $TSContext, storageInput: S3UserInputs): Promise<S3UserInputs | undefined> {
  //if s3 resource exists throw exception
  let storageResourceName: string | undefined = s3GetResourceName();
  if (storageResourceName) {
    throw new Error('Add Storage Failed.. already exists');
  }
  await s3APIHelperTransformAndSaveState(context, storageInput, CLISubCommandType.ADD);
  return storageInput;
}

/**
 * Create new lambda and add as Storage Lambda trigger
 * note:- (legacy logic, should be moved to addLambdaTrigger -  to support multiple lambda triggers)
 * @param context
 * @param s3ResourceName
 * @param storageLambdaTrigger
 * @returns
 */
export async function s3AddStorageLambdaTrigger(
  context: $TSContext,
  s3ResourceName: string,
  storageLambdaTrigger: S3UserInputTriggerFunctionParams,
) {
  let cliInputsState = new S3InputState(s3ResourceName, undefined);
  //Check if migration is required
  if (!cliInputsState.cliInputFileExists()) {
    throw new Error(`Error Adding trigger function on storage resource ${s3ResourceName} : resource does not exist`);
  }
  let s3UserInput = cliInputsState.getUserInput();
  s3UserInput.triggerFunction = storageLambdaTrigger.triggerFunction;
  await cliInputsState.saveCliInputPayload(s3UserInput);
  await createNewLambdaAndUpdateCFN(context, s3UserInput.triggerFunction, undefined /* generate unique uuid*/);
  await s3APIHelperTransformAndSaveState(context, s3UserInput, CLISubCommandType.UPDATE);
  return s3UserInput;
}

/**
 * Remove Storage Lambda trigger
 * note:- (legacy logic, should be moved to addLambdaTrigger -  to support multiple lambda triggers)
 * @param context
 * @param s3ResourceName
 * @param adminLambdaTrigger
 * @returns
 */
export async function s3RemoveStorageLambdaTrigger(context: $TSContext, s3ResourceName: string) {
  let cliInputsState = new S3InputState(s3ResourceName, undefined);
  //Check if migration is required
  if (!cliInputsState.cliInputFileExists()) {
    throw new Error(`Error Adding trigger function on storage resource ${s3ResourceName} : resource does not exist`);
  }

  let s3UserInput = cliInputsState.getUserInput();
  if (s3UserInput.adminTriggerFunction?.triggerFunction === s3UserInput.triggerFunction) {
    throw new Error(
      `Error removing trigger function from storage resource ${s3ResourceName} : function used by ${AmplifyCategories.PREDICTIONS}`,
    );
  }

  s3UserInput.triggerFunction = undefined;
  await s3APIHelperTransformAndSaveState(context, s3UserInput, CLISubCommandType.UPDATE);
}

/**
 * Add existing (Non Storage) Lambda as Admin for Predictions category (Rekognition)
 * The lambda should have been already created.
 * note:- (legacy logic, should be moved to addLambdaTrigger -  to support multiple lambda triggers)
 * @param context
 * @param s3ResourceName
 * @param adminLambdaTrigger
 * @returns
 */
 export async function s3RegisterAdminTrigger(
  context: $TSContext,
  s3ResourceName: string,
  adminLambdaTrigger: S3UserInputTriggerFunctionParams,
) {
  let cliInputsState = new S3InputState(s3ResourceName, undefined);
  //Check if migration is required
  if (!cliInputsState.cliInputFileExists()) {
    throw new Error(`Error Registering existing trigger function on storage resource ${s3ResourceName} : resource does not exist`);
  }
  let s3UserInput = cliInputsState.getUserInput();
  s3UserInput.adminTriggerFunction = adminLambdaTrigger; //TBD check if function is created
  await s3APIHelperTransformAndSaveState(context, s3UserInput, CLISubCommandType.UPDATE);
  return s3UserInput;
}

/**
 * Remove Admin Lambda Trigger for Predictions category (Rekognition)
 * note:- (legacy logic, should be moved to removeLambdaTrigger -  to support multiple lambda triggers)
 * @param context
 * @param s3ResourceName
 * @param adminLambdaTrigger
 * @returns
 */
export async function s3RemoveAdminLambdaTrigger(context: $TSContext, s3ResourceName: string) {
  let cliInputsState = new S3InputState(s3ResourceName, undefined);
  if (!cliInputsState.cliInputFileExists()) {
    throw new Error(`Error Registering existing trigger function on storage resource ${s3ResourceName} : resource does not exist`);
  }
  let s3UserInput = cliInputsState.getUserInput();
  s3UserInput.adminTriggerFunction = undefined;
  await s3APIHelperTransformAndSaveState(context, s3UserInput, CLISubCommandType.UPDATE);
  return s3UserInput;
}

/**
 * (for future use)
 * Add additional trigger function to CLIInputs
 * and generate cloudformation
 * @param context - used to generate stack transform
 * @param s3ResourceName
 * @param triggerFunctionParams
 * @returns cloudformation string
 */
export async function addLambdaTrigger(
  context: $TSContext,
  s3ResourceName: string,
  triggerFunctionParams: S3UserInputTriggerFunctionParams,
): Promise<string | undefined> {
  let cliInputsState = new S3InputState(s3ResourceName, undefined);
  //Check if migration is required
  if (!cliInputsState.cliInputFileExists()) {
    cliInputsState.addAdditionalLambdaTrigger(triggerFunctionParams);
    const stackGenerator = new AmplifyS3ResourceStackTransform(s3ResourceName, context);
    await stackGenerator.transform(CLISubCommandType.UPDATE);
    return stackGenerator.getCFN();
  } else {
    throw new Error(`Error Adding trigger function on storage resource ${s3ResourceName} : resource does not exist`);
  }
}

/** HELPERS */
async function s3APIHelperTransformAndSaveState(context: $TSContext, storageInput: S3UserInputs, phase: CLISubCommandType) {
  //migrate storage and fetch cliInputsState
  if ( phase != CLISubCommandType.ADD && isMigrateStorageRequired(context, storageInput.resourceName as string) ){
      await migrateStorageCategory(context, storageInput.resourceName as string);
  }

  //Save CLI Inputs payload
  let cliInputsState;

  if ( phase === CLISubCommandType.ADD ){
    cliInputsState = new S3InputState(storageInput.resourceName as string, storageInput);
  } else {
    cliInputsState = new S3InputState(storageInput.resourceName as string, undefined );
  }
  await cliInputsState.saveCliInputPayload(storageInput);

  //Generate Cloudformation
  const stackGenerator = new AmplifyS3ResourceStackTransform(storageInput.resourceName as string, context);
  await stackGenerator.transform(phase); //phase = add/update/remove
  //sync amplify-meta
  const dependsOn = stackGenerator.getS3DependsOn();
  //sync amplify meta
  if ( phase == CLISubCommandType.ADD ) {
    context.amplify.updateamplifyMetaAfterResourceAdd(AmplifyCategories.STORAGE, storageInput.resourceName as string, {
      service: AmplifySupportedService.S3,
      providerPlugin: 'awscloudformation',
      dependsOn,
    });
  } else {
    context.amplify.updateamplifyMetaAfterResourceUpdate(
      AmplifyCategories.STORAGE,
      storageInput.resourceName as string,
      'dependsOn',
      dependsOn,
    );
  }
}
