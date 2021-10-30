import { $TSContext, AmplifyCategories, AmplifySupportedService, CLISubCommandType, stateManager } from 'amplify-cli-core';
import { AmplifyS3ResourceStackTransform } from '../cdk-stack-builder/s3-stack-transform';
import { S3UserInputTriggerFunctionParams, S3UserInputs } from '../service-walkthrough-types/s3-user-input-types';
import { S3InputState } from './s3-user-input-state';
import { createNewLambdaAndUpdateCFN } from './s3-walkthrough';

/**
 * @returns Name of S3 resource or undefined
 */
export function s3GetResourceName(): string | undefined {
  const amplifyMeta = stateManager.getMeta();
  console.log('SACPCDEBUG: Inside s3GetResourceName', amplifyMeta[AmplifyCategories.STORAGE]);
  let resourceName = undefined;
  if (amplifyMeta[AmplifyCategories.STORAGE]) {
    const categoryResources = amplifyMeta[AmplifyCategories.STORAGE];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === AmplifySupportedService.S3) {
        resourceName = resource;
      }
    });
  }
  console.log('SACPCDEBUG: Returning s3GetResourceName ', resourceName);
  return resourceName;
}

/**
 * Return the cli-inputs.json
 * @param context
 * @param s3ResourceName
 * @returns
 */
export async function s3GetUserInput(context: $TSContext, s3ResourceName: string): Promise<S3UserInputs> {
  const cliInputsState = new S3InputState(s3ResourceName as string, undefined);
  return cliInputsState.getUserInput();
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
  console.log('SACPCDEBUG: addStorageResource : storageInput provided by predictions', storageInput);
  await s3APIHelperTransformAndSaveState(context, storageInput, CLISubCommandType.ADD);

  return storageInput;
  //return storage name
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
  cliInputsState.saveCliInputPayload(s3UserInput);
  const functionCreated = await createNewLambdaAndUpdateCFN(context, s3UserInput.triggerFunction, undefined /* generate unique uuid*/);
  console.log('SACPCDEBUG: S3 trigger created from api call: ', functionCreated);
  await s3APIHelperTransformAndSaveState(context, s3UserInput, CLISubCommandType.UPDATE);
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
  console.log('SACPCDEBUG: S3 trigger Removed: ');
  await s3APIHelperTransformAndSaveState(context, s3UserInput, CLISubCommandType.UPDATE);
}

/**
 * Create new lambda and add as Admin Lambda for Predictions category (Rekognition)
 * note:- (legacy logic, should be moved to addLambdaTrigger -  to support multiple lambda triggers)
 * @param context
 * @param s3ResourceName
 * @param adminLambdaTrigger
 * @returns s3UserInput
 */
export async function s3AddAdminLambdaTrigger(
  context: $TSContext,
  s3ResourceName: string,
  adminLambdaTrigger: S3UserInputTriggerFunctionParams,
) {
  let cliInputsState = new S3InputState(s3ResourceName, undefined);
  //Check if migration is required
  if (!cliInputsState.cliInputFileExists()) {
    throw new Error(`Error Adding trigger function on storage resource ${s3ResourceName} : resource does not exist`);
  }
  let s3UserInput = cliInputsState.getUserInput();
  //Check if lambda is owned by Predictions, add as additional lambda
  s3UserInput.adminTriggerFunction = adminLambdaTrigger;
  cliInputsState.saveCliInputPayload(s3UserInput);
  const functionCreated = await createNewLambdaAndUpdateCFN(context, adminLambdaTrigger.triggerFunction, s3UserInput.policyUUID);
  console.log('SACPCDEBUG: Function Created for Admin Trigger: ', functionCreated);
  await s3APIHelperTransformAndSaveState(context, s3UserInput, CLISubCommandType.UPDATE);
  return s3UserInput;
}

/**
 * Add existing S3 Lambda Trigger as Admin for Predictions category (Rekognition)
 * note:- (legacy logic, should be moved to addLambdaTrigger -  to support multiple lambda triggers)
 * @param context
 * @param s3ResourceName
 * @param adminLambdaTrigger
 * @returns
 */
export async function s3RegisterExistingLambdaTriggerAsAdmin(
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
  if (s3UserInput.triggerFunction !== adminLambdaTrigger.triggerFunction) {
    throw new Error(
      `Error Registering Admin: ${s3ResourceName} : storage trigger ${s3UserInput.triggerFunction} does not match ${adminLambdaTrigger.triggerFunction}`,
    );
  }
  if (adminLambdaTrigger.category !== AmplifyCategories.STORAGE) {
    throw new Error(
      `Error Registering Admin: ${s3ResourceName} : ${adminLambdaTrigger.triggerFunction} is owned by ${adminLambdaTrigger.category}`,
    );
  }
  s3UserInput.adminTriggerFunction = adminLambdaTrigger;
  await s3APIHelperTransformAndSaveState(context, s3UserInput, CLISubCommandType.UPDATE);
  return s3UserInput;
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
  console.log("s3RegisterAdminTrigger : s3ResourceName:  ", s3ResourceName , " adminLambdaTrigger: ", adminLambdaTrigger );
  let cliInputsState = new S3InputState(s3ResourceName, undefined);
  //Check if migration is required
  if (!cliInputsState.cliInputFileExists()) {
    throw new Error(`Error Registering existing trigger function on storage resource ${s3ResourceName} : resource does not exist`);
  }
  let s3UserInput = cliInputsState.getUserInput();
  if( !s3UserInput.triggerFunction || s3UserInput.triggerFunction != 'NONE'){
    s3UserInput.triggerFunction = adminLambdaTrigger.triggerFunction;
  }
  s3UserInput.adminTriggerFunction = adminLambdaTrigger; //TBD check if function is created
  console.log("SACPCDEBUG:[storage]: Registering s3UserInput : ", s3UserInput);
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
  //Save CLI Inputs payload
  let cliInputsState;
  if ( phase === CLISubCommandType.ADD ){
    cliInputsState = new S3InputState(storageInput.resourceName as string, storageInput);
  } else {
    cliInputsState = new S3InputState(storageInput.resourceName as string, undefined );
  }
  console.log("SACPCDEBUG:s3APIHelperTransformAndSaveState :  ", cliInputsState);

  cliInputsState.saveCliInputPayload(storageInput);

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
