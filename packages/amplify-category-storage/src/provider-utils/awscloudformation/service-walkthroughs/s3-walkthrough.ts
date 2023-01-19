import {
  $TSAny,
  $TSContext,
  $TSMeta,
  $TSObject,
  AmplifyCategories,
  AmplifySupportedService,
  CLISubCommandType,
  exitOnNextTick,
  getMigrateResourceMessageForOverride,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { printer, prompter } from 'amplify-prompts';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { AmplifyS3ResourceStackTransform } from '../cdk-stack-builder/s3-stack-transform';
import { getAllDefaults } from '../default-values/s3-defaults';
import { S3TriggerFunctionType, S3UserInputs } from '../service-walkthrough-types/s3-user-input-types';
import { checkStorageAuthenticationRequirements, migrateAuthDependencyResource } from './s3-auth-api';
import { printErrorAlreadyCreated, printErrorAuthResourceMigrationFailed, printErrorNoResourcesToUpdate } from './s3-errors';
import {
  askAndInvokeAuthWorkflow,
  askAndOpenFunctionEditor,
  askAuthPermissionQuestion,
  askBucketNameQuestion,
  askGroupOrIndividualAccessFlow,
  askResourceNameQuestion,
  askSelectExistingFunctionToAddTrigger,
  askTriggerFunctionTypeQuestion,
  askUpdateTriggerSelection,
  askWhoHasAccessQuestion,
  conditionallyAskGuestPermissionQuestion,
  S3CLITriggerUpdateMenuOptions,
} from './s3-questions';
import { s3GetAdminTriggerFunctionName } from './s3-resource-api';
import { S3InputState } from './s3-user-input-state';

/**
 * addWalkthrough: add storage walkthrough for S3 resource
 * (creates cliInputs for the resource).
 * @param context
 * @param defaultValuesFilename
 * @param serviceMetadata
 * @param options selected by user
 * @returns resourceName
 */
export async function addWalkthrough(context: $TSContext, defaultValuesFilename: string, serviceMetadata: $TSObject, options: $TSObject) {
  const { amplify } = context;
  const amplifyMeta = stateManager.getMeta();

  //Migrate auth category if required
  try {
    const authMigerationAccepted = await migrateAuthDependencyResource(context);
    if (!authMigerationAccepted) {
      exitOnNextTick(0);
    }
  } catch (error) {
    await printErrorAuthResourceMigrationFailed(context);
    exitOnNextTick(0);
  }

  //First ask customers to configure Auth on the S3 resource, invoke auth workflow
  await askAndInvokeAuthWorkflow(context);
  const resourceName = await getS3ResourceNameFromMeta(amplifyMeta);

  if (resourceName) {
    await printErrorAlreadyCreated(context);
    exitOnNextTick(0);
  } else {
    //Ask S3 walkthrough questions
    const policyID = buildShortUUID(); //prefix/suffix for all resources.
    const defaultValues = getAllDefaults(amplify.getProjectDetails(), policyID);
    const storageResourceName = await askResourceNameQuestion(context, defaultValues); //Cannot be changed once added
    const bucketName = await askBucketNameQuestion(context, defaultValues, storageResourceName); //Cannot be changed once added
    let cliInputs: S3UserInputs = Object.assign({}, defaultValues);
    cliInputs.policyUUID = policyID;
    cliInputs.resourceName = storageResourceName;
    cliInputs.bucketName = bucketName;
    //Check if user-pools are already created
    const userPoolGroupList = context.amplify.getUserPoolGroupList();
    if (userPoolGroupList && userPoolGroupList.length > 0) {
      //Ask Groups, Auth or Guest , or Both access
      cliInputs = await askGroupOrIndividualAccessFlow(userPoolGroupList, context, cliInputs);
      //Ask S3 walkthrough questions
    } else {
      //Ask Auth or Guest access
      cliInputs.storageAccess = await await askWhoHasAccessQuestion(context, defaultValues); //Auth/Guest
      cliInputs.authAccess = await askAuthPermissionQuestion(context, defaultValues);
      cliInputs.guestAccess = await await conditionallyAskGuestPermissionQuestion(cliInputs.storageAccess, context, defaultValues);
    }
    const triggerFunction = await startAddTriggerFunctionFlow(context, storageResourceName, policyID, undefined);
    cliInputs.triggerFunction = triggerFunction ? triggerFunction : 'NONE';

    //Validate Authentication requirements
    //e.g if storage is added after import auth,
    const allowUnauthenticatedIdentities = cliInputs.guestAccess && cliInputs.guestAccess.length > 0;
    await checkStorageAuthenticationRequirements(context, storageResourceName, allowUnauthenticatedIdentities);

    //Save CLI Inputs payload
    const cliInputsState = new S3InputState(context, cliInputs.resourceName as string, cliInputs);
    await cliInputsState.saveCliInputPayload(cliInputs);

    //Generate Cloudformation
    const stackGenerator = new AmplifyS3ResourceStackTransform(cliInputs.resourceName as string, context);
    await stackGenerator.transform(CLISubCommandType.ADD);

    //Insert dependsOn into Options!! - The caller syncs this into amplify-meta
    const dependsOn = stackGenerator.getS3DependsOn();
    if (dependsOn) {
      options.dependsOn = dependsOn;
    }
    return cliInputs.resourceName;
  }
  return undefined;
}

/**
 * updateWalkthrough: update storage walkthrough for S3 resource
 * (updates cliInputs for the resource).
 * @param context
 * @returns resourceName
 */
export async function updateWalkthrough(context: $TSContext) {
  const amplifyMeta = stateManager.getMeta();
  const storageResourceName: string | undefined = await getS3ResourceNameFromMeta(amplifyMeta);
  if (storageResourceName === undefined) {
    await printErrorNoResourcesToUpdate(context);
    exitOnNextTick(0);
  } else {
    // For better DX check if the storage is imported
    if (amplifyMeta[AmplifyCategories.STORAGE][storageResourceName].serviceType === 'imported') {
      printer.error('Updating of an imported storage resource is not supported.');
      return undefined;
    }
    //load existing cliInputs
    const cliInputsState = new S3InputState(context, storageResourceName, undefined);

    //Check if migration is required
    const headlessMigrate = context.input.options?.yes || context.input.options?.forcePush || context.input.options?.headless;
    if (!cliInputsState.cliInputFileExists()) {
      if (
        headlessMigrate ||
        (await prompter.yesOrNo(getMigrateResourceMessageForOverride(AmplifyCategories.STORAGE, storageResourceName), true))
      ) {
        //migrate auth and storage
        await cliInputsState.migrate(context);
        const stackGenerator = new AmplifyS3ResourceStackTransform(storageResourceName, context);
        await stackGenerator.transform(CLISubCommandType.UPDATE); //generates cloudformation
      } else {
        return undefined;
      }
    }

    const previousUserInput = cliInputsState.getUserInput();
    let cliInputs: S3UserInputs = Object.assign({}, previousUserInput); //overwrite this with updated params
    //note: If userPoolGroups have been created/Updated, then they need to be updated in CLI Inputs
    //This check is not required once Auth is integrated with s3-auth-apis.
    const userPoolGroupList = context.amplify.getUserPoolGroupList();
    if (userPoolGroupList && userPoolGroupList.length > 0) {
      cliInputs = await askGroupOrIndividualAccessFlow(userPoolGroupList, context, cliInputs);
      //Ask S3 walkthrough questions
    } else {
      //Build userInputs for S3 resources
      cliInputs.storageAccess = await askWhoHasAccessQuestion(context, previousUserInput); //Auth/Guest
      cliInputs.authAccess = await askAuthPermissionQuestion(context, previousUserInput);
      cliInputs.guestAccess = await conditionallyAskGuestPermissionQuestion(cliInputs.storageAccess, context, previousUserInput);
    }
    //Build userInputs for S3 resources
    if (previousUserInput.triggerFunction && previousUserInput.triggerFunction != 'NONE') {
      cliInputs.triggerFunction = await startUpdateTriggerFunctionFlow(
        context,
        storageResourceName,
        previousUserInput.policyUUID as string,
        previousUserInput.triggerFunction,
      );
    } else {
      cliInputs.triggerFunction = await startAddTriggerFunctionFlow(
        context,
        storageResourceName,
        previousUserInput.policyUUID as string,
        undefined,
      );
    }

    //Validate Authentication requirements
    //e.g if storage is added after import auth,
    const allowUnauthenticatedIdentities = cliInputs.guestAccess && cliInputs.guestAccess.length > 0;
    await checkStorageAuthenticationRequirements(context, storageResourceName, allowUnauthenticatedIdentities);

    //Save CLI Inputs payload
    await cliInputsState.saveCliInputPayload(cliInputs);
    //Generate Cloudformation
    const stackGenerator = new AmplifyS3ResourceStackTransform(cliInputs.resourceName as string, context);
    await stackGenerator.transform(CLISubCommandType.UPDATE);
    return cliInputs.resourceName;
  }
  return undefined;
}

/**
 * Check if Storage feature needs migration
 * @param context
 * @param resourceName - storage resource name
 * @returns
 */
export function isMigrateStorageRequired(context: $TSContext, resourceName: string) {
  const projectBackendDirPath = pathManager.getBackendDirPath();
  const cliInputsFilePath = path.resolve(path.join(projectBackendDirPath, AmplifyCategories.STORAGE, resourceName, 'cli-inputs.json'));
  return !fs.existsSync(cliInputsFilePath);
}

/**
 * Migrate workflow for S3 resource
 * - converts old context files into cliInputs and transforms into cloudformation.
 * - removes all old artifacs
 * @param context
 * @param resourceName
 */
export async function migrateStorageCategory(context: $TSContext, resourceName: string): Promise<string | undefined> {
  const cliInputsState = new S3InputState(context, resourceName, undefined);
  //Check if migration is required
  if (!cliInputsState.cliInputFileExists()) {
    await cliInputsState.migrate(context);
    const stackGenerator = new AmplifyS3ResourceStackTransform(resourceName, context);
    await stackGenerator.transform(CLISubCommandType.MIGRATE);
    return stackGenerator.getCFN();
  } else {
    return undefined;
  }
}

/**** Helper functions and Interactive flows *****/

/**
 * buildShortUUID() - generator function
 * Generates a short-id from a UUID. The short-id is used by the caller to convert
 * policy or resource names into globally unique names (atleast reduce the probability of clash).
 * @returns shortId
 */
export function buildShortUUID() {
  const [shortId] = uuid().split('-');
  return shortId;
}

/**
 * Start Flow to add new Trigger Function to S3 resource being created in 'add storage' or 'update storage' flow.
 * @param context
 * @param resourceName - S3 resource name
 * @param policyID - Prefix/Suffix for function-name/policy
 * @param existingTriggerFunction
 * @returns
 */
async function startAddTriggerFunctionFlow(
  context: $TSContext,
  resourceName: string,
  policyID: string,
  existingTriggerFunction: string | undefined,
): Promise<string | undefined> {
  const enableLambdaTriggerOnS3: boolean = await prompter.yesOrNo('Do you want to add a Lambda Trigger for your S3 Bucket?', false);
  let triggerFunction: string | undefined = undefined;
  if (enableLambdaTriggerOnS3) {
    try {
      //create new function or add existing function as trigger to S3 bucket.
      triggerFunction = await addTrigger(S3CLITriggerFlow.ADD, context, resourceName, policyID, existingTriggerFunction);
    } catch (e) {
      printer.error((e as Error).message);
    }
  }
  return triggerFunction;
}

/**
 * Start flow to update trigger-function on the S3 resource . ( only in update storage flow ).
 * @param context
 * @param resourceName
 * @param policyID
 * @param existingTriggerFunction
 * @returns configured triggerFunction name
 */
async function startUpdateTriggerFunctionFlow(
  context: $TSContext,
  resourceName: string,
  policyID: string,
  existingTriggerFunction: string | undefined,
): Promise<string | undefined> {
  let triggerFunction = existingTriggerFunction;

  //Update Trigger Flow
  let continueWithTriggerOperationQuestion = true;
  do {
    const triggerOperationAnswer = await askUpdateTriggerSelection(existingTriggerFunction);
    switch (triggerOperationAnswer) {
      case S3CLITriggerUpdateMenuOptions.ADD:
      case S3CLITriggerUpdateMenuOptions.UPDATE: {
        try {
          triggerFunction = await addTrigger(S3CLITriggerFlow.UPDATE, context, resourceName, policyID, existingTriggerFunction);
          continueWithTriggerOperationQuestion = false;
        } catch (e) {
          printer.error((e as Error).message);
          continueWithTriggerOperationQuestion = true;
        }
        break;
      }
      case S3CLITriggerUpdateMenuOptions.REMOVE: {
        if (triggerFunction) {
          await removeTriggerPolicy(context, resourceName, triggerFunction);
          triggerFunction = undefined; //cli inputs should not have function
          continueWithTriggerOperationQuestion = false;
        }
        break;
      }
      case S3CLITriggerUpdateMenuOptions.SKIP: {
        continueWithTriggerOperationQuestion = false;
        break;
      }
      default:
        printer.error(`${triggerOperationAnswer} not supported`);
        continueWithTriggerOperationQuestion = false;
    }
  } while (continueWithTriggerOperationQuestion);

  return triggerFunction;
}

/**
 * addTrigger - Handles add/update trigger function flow.
 * note:- called from both ADD/UPDATE storage resource flows.
 * @param triggerFlowType  - Add/Update CLI flow
 * @param context - CLI context
 * @param resourceName - Name of S3 resource
 * @param policyID - To be used to generate new function name
 * @param existingTriggerFunction - Existing trigger function if configured.
 * @returns Updated/Created triggerFunction
 */
export async function addTrigger(
  triggerFlowType: S3CLITriggerFlow,
  context: $TSContext,
  resourceName: string,
  policyID: string,
  existingTriggerFunction: string | undefined,
): Promise<string | undefined> {
  const triggerStateEvent = getCLITriggerStateEvent(triggerFlowType, existingTriggerFunction);
  let triggerFunction: string | undefined = existingTriggerFunction;
  switch (triggerStateEvent) {
    case S3CLITriggerStateEvent.ERROR:
      throw new Error("Lambda Trigger is already enabled, please use 'amplify update storage'");
    case S3CLITriggerStateEvent.ADD_NEW_TRIGGER: {
      // Check if functions exist and if exists, ask if Cx wants to use existing or create new
      const existingLambdaResources = await getExistingFunctionsForTrigger(context, existingTriggerFunction, false);
      if (existingLambdaResources && existingLambdaResources.length > 0) {
        triggerFunction = await interactiveAskTriggerTypeFlow(context, policyID, existingTriggerFunction, existingLambdaResources);
      } else {
        //add a new function
        triggerFunction = await interactiveCreateNewLambdaAndUpdateCFN(context);
      }
      break;
    }
    case S3CLITriggerStateEvent.REPLACE_TRIGGER:
      triggerFunction = await interactiveAskTriggerTypeFlow(context, policyID, existingTriggerFunction);
      break;
    case S3CLITriggerStateEvent.DELETE_TRIGGER:
      triggerFunction = undefined; // no trigger function.
      break;
  } // END - TriggerState event
  return triggerFunction;
}

/**
 * Remove Trigger function policy from Function's CFN
 * @param context
 * @param resourceName - S3 resource name
 * @param triggerFunction - Configured trigger function
 * @returns triggerFunction name (for reference)
 */
async function removeTriggerPolicy(context: $TSContext, resourceName: string, triggerFunction: string) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const functionCFNFilePath = path.join(
    projectBackendDirPath,
    'function',
    triggerFunction,
    `${triggerFunction}-cloudformation-template.json`,
  );
  if (fs.existsSync(functionCFNFilePath)) {
    const functionCFNFile = context.amplify.readJsonFile(functionCFNFilePath);

    delete functionCFNFile.Resources[`${resourceName}TriggerPolicy`];
    delete functionCFNFile.Resources[`${resourceName}Trigger`];

    // Update the functions resource
    const functionCFNString = JSON.stringify(functionCFNFile, null, 4);

    fs.writeFileSync(functionCFNFilePath, functionCFNString, 'utf8');
  }
  return triggerFunction;
}

/**
 * Queries Amplify meta file for all S3 resources and returns the resource-name
 * @param context
 * @param amplifyMeta
 * @returns s3 resource name
 */
async function getS3ResourceNameFromMeta(amplifyMeta: $TSAny): Promise<string | undefined> {
  //Fetch storage resources from Amplify Meta file
  const storageResources: Record<string, $TSAny> | undefined = getS3ResourcesFromAmplifyMeta(amplifyMeta);
  if (storageResources) {
    if (Object.keys(storageResources).length === 0) {
      return undefined;
    }
    const [resourceName] = Object.keys(storageResources); //only one resource is allowed
    return resourceName;
  }
  return undefined;
}

/**
 * getS3ResourcesFromAmplifyMeta
 * @param amplifyMeta
 * @returns { resourceName => resourceData in Amplify metafile}
 */
function getS3ResourcesFromAmplifyMeta(amplifyMeta: $TSMeta): Record<string, $TSAny> | undefined {
  if (!Object.prototype.hasOwnProperty.call(amplifyMeta, AmplifyCategories.STORAGE)) {
    return undefined;
  }
  const resources: Record<string, $TSAny> = {}; //maps cx resource to
  Object.keys(amplifyMeta[AmplifyCategories.STORAGE]).forEach(resourceName => {
    if (
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].service === AmplifySupportedService.S3 &&
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].mobileHubMigrated !== true &&
      amplifyMeta[AmplifyCategories.STORAGE][resourceName].serviceType !== 'imported'
    ) {
      resources[resourceName] = amplifyMeta[AmplifyCategories.STORAGE][resourceName];
    }
  });
  return resources;
}

/**
 * Important!!: Creates new Lambda function name and Generates Lambda function Cloudformation.
 * note:- This will be removed once Functions move to CDK.
 * Function names use a unique uuid to generate function-names since the User
 * could potentially generate multiple functions and switch between them for triggers.
 * @param context
 * @returns Generated function name.
 */
export async function createNewLambdaAndUpdateCFN(
  context: $TSContext,
  triggerFunctionName: string | undefined,
  policyUUID: string | undefined,
): Promise<string> {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  const newShortUUID = policyUUID ? policyUUID : buildShortUUID();
  const newFunctionName = triggerFunctionName ? triggerFunctionName : `S3Trigger${newShortUUID}`;
  const pluginDir = __dirname;
  const defaults = {
    functionName: `${newFunctionName}`,
    roleName: `${newFunctionName}LambdaRole${newShortUUID}`,
  };

  const copyJobs = [
    {
      dir: pluginDir,
      template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'lambda-cloudformation-template.json.ejs'),
      target: path.join(targetDir, 'function', newFunctionName, `${newFunctionName}-cloudformation-template.json`),
    },
    {
      dir: pluginDir,
      template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'event.json'),
      target: path.join(targetDir, 'function', newFunctionName, 'src', 'event.json'),
    },
    {
      dir: pluginDir,
      template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'index.js'),
      target: path.join(targetDir, 'function', newFunctionName, 'src', 'index.js'),
    },
    {
      dir: pluginDir,
      template: path.join('..', '..', '..', '..', 'resources', 'triggers', 's3', 'package.json.ejs'),
      target: path.join(targetDir, 'function', newFunctionName, 'src', 'package.json'),
    },
  ];

  // copy over the files
  await context.amplify.copyBatch(context, copyJobs, defaults);

  // Update amplify-meta and backend-config
  const backendConfigs = {
    service: AmplifySupportedService.LAMBDA,
    providerPlugin: 'awscloudformation',
    build: true,
  };

  await context.amplify.updateamplifyMetaAfterResourceAdd('function', newFunctionName, backendConfigs);

  printer.success(`Successfully added resource ${newFunctionName} locally`);
  return newFunctionName;
}

/**
 * Gets the list of Lambda functions for configuring as trigges on the S3 resource.
 * note:- It excludes currently configured trigger function from the list.
 * @param context
 * @param excludeFunctionName
 * @param isInteractive
 * @returns
 */
async function getExistingFunctionsForTrigger(
  context: $TSContext,
  excludeFunctionName: string | undefined,
  isInteractive: boolean,
): Promise<Array<string>> {
  //Build the list of functions to be excluded ( existing-trigger, adminTrigger )
  const excludeFunctionList = excludeFunctionName ? [excludeFunctionName] : [];
  const adminTriggerFunction = await s3GetAdminTriggerFunctionName(context);
  if (adminTriggerFunction && adminTriggerFunction != 'NONE') {
    excludeFunctionList.push(adminTriggerFunction);
  }

  let lambdaResourceNames: Array<string> = await getLambdaFunctionList(context);
  if (excludeFunctionList.length > 0 && lambdaResourceNames && lambdaResourceNames.length > 0) {
    lambdaResourceNames = lambdaResourceNames.filter((lambdaResourceName: $TSAny) => !excludeFunctionList.includes(lambdaResourceName));
  }
  if (lambdaResourceNames.length === 0 && isInteractive) {
    throw new Error("No functions were found in the project. Use 'amplify add function' to add a new function.");
  }
  return lambdaResourceNames;
}

/**
 *  S3 Trigger CLI flow types
 *  A flow can be a sequence of interactive actions
 */
export enum S3CLITriggerFlow {
  ADD = 'TRIGGER_ADD_FLOW',
  UPDATE = 'TRIGGER_UPDATE_FLOW',
  REMOVE = 'TRIGGER_REMOVE_FLOW',
}

/**
 * S3 CLI State update.
 * Used by a Flow to generate the action to be performed on the Trigger's State.
 */
export enum S3CLITriggerStateEvent {
  ADD_NEW_TRIGGER = 'ADD_NEW_TRIGGER', //no trigger exists, need to be added in cloudformation
  REPLACE_TRIGGER = 'REPLACE_TRIGGER', //trigger exists, (delete old trigger, add new trigger)
  DELETE_TRIGGER = 'DELETE_TRIGGER', //delete existing trigger from s3 cloudformation and delete file
  ERROR = 'TRIGGER_ERROR', //This state change is not allowed
  NO_OP = 'TRIGGER_NO_OP', //No change required here
}

/**
 * Based on the Trigger-flow + parameters provided by user, we infer the action to be performed
 * @param triggerFlowType ( add, update or remove flow)
 * @param existingTriggerFunction ( name of existing trigger function )
 * @returns Action to be performed.
 */
function getCLITriggerStateEvent(triggerFlowType: S3CLITriggerFlow, existingTriggerFunction: string | undefined): S3CLITriggerStateEvent {
  if (triggerFlowType === S3CLITriggerFlow.ADD) {
    if (existingTriggerFunction) {
      return S3CLITriggerStateEvent.ERROR; //ERROR:Adding a new function when a trigger already exists
    } else {
      return S3CLITriggerStateEvent.ADD_NEW_TRIGGER;
    }
  } else {
    if (triggerFlowType === S3CLITriggerFlow.UPDATE) {
      return S3CLITriggerStateEvent.REPLACE_TRIGGER; //Update function should ask for existing or new function to be added
    } else {
      //REMOVE Flow
      if (existingTriggerFunction) {
        return S3CLITriggerStateEvent.DELETE_TRIGGER;
      } else {
        return S3CLITriggerStateEvent.NO_OP;
      }
    }
  }
}

/**
 * Interactive: Create a new function and display "open file in editor" prompt
 * @param context
 * @returns TriggerFunction name
 */
async function interactiveCreateNewLambdaAndUpdateCFN(context: $TSContext) {
  const newTriggerFunction = await createNewLambdaAndUpdateCFN(context, undefined /*default function name*/, undefined /*unique shortid*/);
  await askAndOpenFunctionEditor(context, newTriggerFunction);
  return newTriggerFunction;
}

/**
 * Interactive: Allow User to Select existing function
 * @param context
 * @param existingTriggerFunction - name of trigger function, already configured.
 * @param existingLambdaResources - all available functions
 * @returns selectedFunction - Function selected by User.
 */
async function interactiveAddExistingLambdaAndUpdateCFN(
  context: $TSContext,
  existingTriggerFunction: string | undefined = undefined,
  existingLambdaResources: Array<string> | undefined = undefined,
) {
  //Get all available lambdas - [ exclude the existing triggerFunction ]
  //note:- In an [update storage + Add trigger flow] , the existing lambda resources are already read and passed into this function.
  const lambdaResources = existingLambdaResources
    ? existingLambdaResources
    : await getExistingFunctionsForTrigger(context, existingTriggerFunction, true);
  //Select the function to add trigger
  const selectedFunction = await askSelectExistingFunctionToAddTrigger(lambdaResources);
  //User selected the currently configured trigger function. Hence CFN not updated.
  return selectedFunction;
}

/**
 * Interactive:Flow: Ask User to select existing or new function as trigger function.
 * Call downstream interactive functions
 * @param context
 * @param policyID
 * @param existingTriggerFunction - already configured trigger function
 * @param existingLambdaResources - list of all lambda functions avaiable to be configured as triggers
 * @returns newTriggerFunction or selectedTriggerFunction
 */
async function interactiveAskTriggerTypeFlow(
  context: $TSContext,
  _policyID: string,
  existingTriggerFunction: string | undefined,
  existingLambdaResources: Array<string> | undefined = undefined,
) {
  const triggerTypeAnswer: S3TriggerFunctionType = await askTriggerFunctionTypeQuestion();
  switch (triggerTypeAnswer) {
    case S3TriggerFunctionType.EXISTING_FUNCTION: {
      const selectedFunction = await interactiveAddExistingLambdaAndUpdateCFN(context, existingTriggerFunction, existingLambdaResources);
      return selectedFunction;
    }
    case S3TriggerFunctionType.NEW_FUNCTION: {
      //Create a new lambda trigger and update cloudformation
      const newTriggerFunction = await interactiveCreateNewLambdaAndUpdateCFN(context);
      return newTriggerFunction;
    }
  } //Existing function or New function
  return undefined;
}

/**
 *
 * @param context Query CLI context to get the list of available Lambda functions
 * @returns List of lambda resources
 */
async function getLambdaFunctionList(context: $TSAny) {
  const { allResources } = await context.amplify.getResourceStatus();
  const lambdaResources =
    allResources && allResources.length > 0
      ? allResources
          ?.filter((resource: $TSAny) => resource.service === AmplifySupportedService.LAMBDA)
          ?.map((resource: $TSAny) => resource.resourceName)
      : [];
  return lambdaResources ? lambdaResources : [];
}
export const resourceAlreadyExists = () => {
  const amplifyMeta = stateManager.getMeta();
  let resourceName;

  if (amplifyMeta[AmplifyCategories.STORAGE]) {
    const categoryResources = amplifyMeta[AmplifyCategories.STORAGE];

    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === AmplifySupportedService.S3) {
        resourceName = resource;
      }
    });
  }

  return resourceName;
};

/**
 * Query Amplify Metafile and check if Auth is configured
 * @param context
 * @returns true if Auth is configured else false
 */
export function checkIfAuthExists() {
  const amplifyMeta = stateManager.getMeta();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

  if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
    const categoryResources = amplifyMeta[authCategory];

    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === authServiceName) {
        authExists = true;
      }
    });
  }
  return authExists;
}

/**
 * Build IAM policy cloudformation from CRUD options
 * @param resourceName
 * @param crudOptions
 * @returns IAM policy cloudformation
 */
export function getIAMPolicies(resourceName: $TSAny, crudOptions: $TSAny) {
  const policy = [];
  let actions = new Set();

  crudOptions.forEach((crudOption: $TSAny) => {
    switch (crudOption) {
      case 'create':
        actions.add('s3:PutObject');
        break;
      case 'update':
        actions.add('s3:PutObject');
        break;
      case 'read':
        actions.add('s3:GetObject');
        actions.add('s3:ListBucket');
        break;
      case 'delete':
        actions.add('s3:DeleteObject');
        break;
      default:
        printer.info(`${crudOption} not supported`);
    }
  });

  // @ts-expect-error ts-migrate(2740) FIXME: Type 'unknown[]' is missing the following properti... Remove this comment to see the full error message
  actions = Array.from(actions);
  if ((actions as $TSAny).includes('s3:ListBucket')) {
    let listBucketPolicy = {};
    listBucketPolicy = {
      Effect: 'Allow',
      Action: 's3:ListBucket',
      Resource: [
        {
          'Fn::Join': [
            '',
            [
              'arn:aws:s3:::',
              {
                Ref: `${AmplifyCategories.STORAGE}${resourceName}BucketName`,
              },
            ],
          ],
        },
      ],
    };
    actions = (actions as $TSAny).filter((action: $TSAny) => action != 's3:ListBucket');
    policy.push(listBucketPolicy);
  }
  const s3ObjectPolicy = {
    Effect: 'Allow',
    Action: actions,
    Resource: [
      {
        'Fn::Join': [
          '',
          [
            'arn:aws:s3:::',
            {
              Ref: `${AmplifyCategories.STORAGE}${resourceName}BucketName`,
            },
            '/*',
          ],
        ],
      },
    ],
  };
  policy.push(s3ObjectPolicy);
  const attributes = ['BucketName'];

  return { policy, attributes };
}
