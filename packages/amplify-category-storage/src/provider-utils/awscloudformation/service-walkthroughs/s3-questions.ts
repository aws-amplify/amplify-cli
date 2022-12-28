import { $TSAny, $TSContext, exitOnNextTick } from 'amplify-cli-core';
import { matchRegex, alphanumeric, and, maxLength, minLength, printer, prompter } from 'amplify-prompts';
import {
  getRoleAccessDefaultValues,
  S3AccessType,
  S3PermissionType,
  S3TriggerFunctionType,
  S3UserAccessRole,
  S3UserInputs,
} from '../service-walkthrough-types/s3-user-input-types';
import { S3PermissionMapType } from './s3-user-input-state';
import { checkIfAuthExists } from './s3-walkthrough';
import path from 'path';

export const permissionMap: S3PermissionMapType = {
  'create/update': [S3PermissionType.CREATE_AND_UPDATE],
  read: [S3PermissionType.READ],
  delete: [S3PermissionType.DELETE],
};

export enum S3CLITriggerUpdateMenuOptions {
  ADD = 'Add the Trigger',
  UPDATE = 'Update the Trigger',
  REMOVE = 'Remove the Trigger',
  SKIP = 'Skip Question',
}

export enum UserPermissionTypeOptions {
  AUTH_GUEST_USERS = 'Auth/Guest Users',
  INDIVIDUAL_GROUPS = 'Individual Groups',
  BOTH = 'Both',
  LEARN_MORE = 'Learn more',
}

export const possibleCRUDOperations = Object.keys(permissionMap).map(el => ({
  name: el,
  value: normalizePermissionsMapValue(permissionMap[el]),
}));

/**
 * askAndOpenFunctionEditor
 * Ask user if they want to edit the function,
 * Open the function's index.js in the editor
 * @param context
 * @param functionName
 */
export async function askAndOpenFunctionEditor(context: $TSContext, functionName: string) {
  const targetDir = context.amplify.pathManager.getBackendDirPath();
  if (await prompter.confirmContinue(`Do you want to edit the local ${functionName} lambda function now?`)) {
    await context.amplify.openEditor(context, path.join(targetDir, 'function', functionName, 'src', 'index.js'));
  }
}

export async function askTriggerFunctionTypeQuestion(): Promise<S3TriggerFunctionType> {
  const message = 'Select from the following options';
  const choices: string[] = [S3TriggerFunctionType.EXISTING_FUNCTION, S3TriggerFunctionType.NEW_FUNCTION];
  const triggerTypeAnswer = await prompter.pick(message, choices);
  return triggerTypeAnswer as S3TriggerFunctionType;
}

export async function askSelectExistingFunctionToAddTrigger(choiceslambdaResources: Array<string>): Promise<string> {
  const message = 'Select from the following options';
  const selectedLambdaResourceName = await prompter.pick(message, choiceslambdaResources);
  return selectedLambdaResourceName;
}

export async function askAndInvokeAuthWorkflow(context: $TSContext) {
  while (!checkIfAuthExists()) {
    const shouldAddAuth = await prompter.yesOrNo(
      'You need to add auth (Amazon Cognito) to your project in order to add storage for user files. Do you want to add auth now?',
      true,
    );
    if (shouldAddAuth) {
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
      break;
    } else {
      context.usageData.emitSuccess();
      exitOnNextTick(0);
    }
  }
}

export async function askResourceNameQuestion(context: $TSContext, defaultValues: $TSAny): Promise<string> {
  const message = 'Provide a friendly name for your resource that will be used to label this category in the project:';
  const defaultResourceName = defaultValues['resourceName'];
  const onErrorMsg = 'Resource name should be alphanumeric';
  const resourceName = await prompter.input<'one', string>(message, { validate: alphanumeric(onErrorMsg), initial: defaultResourceName });
  return resourceName;
}

export async function askBucketNameQuestion(context: $TSContext, defaultValues: S3UserInputs, resourceName: string): Promise<string> {
  const message = 'Provide bucket name:';
  const onErrorMsg =
    'Bucket name can only use the following characters: a-z 0-9 - and should have minimum 3 character and max of 47 character';
  const validator = and([matchRegex(/^[a-z0-9-]+$/), minLength(3), maxLength(47)], onErrorMsg);
  const bucketName = await prompter.input<'one', string>(message, { validate: validator, initial: defaultValues['bucketName'] });
  return bucketName;
}

function getChoiceIndexByValue(choices: { name: string; value: $TSAny }[], value: $TSAny) {
  const choiceValues = choices.map((choice: { name: string; value: $TSAny }) => choice.value);
  return choiceValues.indexOf(value);
}

export async function askWhoHasAccessQuestion(context: $TSContext, defaultValues: S3UserInputs): Promise<S3AccessType> {
  const message = 'Who should have access:';
  const choices = [
    {
      name: 'Auth users only',
      value: 'auth',
    },
    {
      name: 'Auth and guest users',
      value: 'authAndGuest',
    },
  ];
  const selectedIndex = defaultValues.storageAccess ? getChoiceIndexByValue(choices, defaultValues.storageAccess) : 0;
  const answer = await prompter.pick<'one', string>(message, choices, { initial: selectedIndex });
  return answer as S3AccessType;
}

/**
 * Normalize User Access Role for View
 * @param role
 * @param groupName
 * @returns
 */
function normalizeUserRole(role: S3UserAccessRole, groupName: string | undefined) {
  switch (role) {
    case S3UserAccessRole.AUTH: {
      return 'Authenticated';
    }
    case S3UserAccessRole.GUEST: {
      return S3UserAccessRole.GUEST;
    }
    case S3UserAccessRole.GROUP: {
      return groupName;
    }
  }
  return undefined;
}

export async function askCRUDQuestion(
  role: S3UserAccessRole,
  groupName: string | undefined = undefined,
  context: $TSContext,
  defaultValues: S3UserInputs,
): Promise<Array<S3PermissionType>> {
  const roleDefaultValues = getRoleAccessDefaultValues(role, groupName, defaultValues);
  const userRole = normalizeUserRole(role, groupName);
  const message = `What kind of access do you want for ${userRole} users?`;
  const choices = possibleCRUDOperations;
  const initialIndexes = getIndexArrayByValue(possibleCRUDOperations, roleDefaultValues);
  let selectedPermissions;
  do {
    selectedPermissions = await prompter.pick<'many', string>(message, choices, { returnSize: 'many', initial: initialIndexes });
    if (!selectedPermissions || selectedPermissions.length <= 0) {
      printer.warn('Select at least one option');
    }
  } while (!selectedPermissions || selectedPermissions.length <= 0);
  return selectedPermissions as Array<S3PermissionType>;
}

export async function askUserPoolGroupSelectionQuestion(
  userPoolGroupList: Array<string>,
  context: $TSContext,
  defaultValues: S3UserInputs,
): Promise<string[]> {
  const message = 'Select groups:';
  const choices = userPoolGroupList;
  const selectedChoices = defaultValues.groupAccess ? Object.keys(defaultValues.groupAccess) : [];
  const selectedIndexes = selectedChoices ? getIndexArray(choices, selectedChoices) : undefined;
  const userPoolGroups = await prompter.pick<'many', string>(message, choices, { returnSize: 'many', initial: selectedIndexes });
  //prompter pick-many returns string if returnsize is 1, and array otherwise.
  if (Array.isArray(userPoolGroups)) {
    return userPoolGroups as string[];
  } else {
    //Type is string
    return [userPoolGroups];
  }
}

export async function askUserPoolGroupPermissionSelectionQuestion(): Promise<UserPermissionTypeOptions> {
  const message = 'Restrict access by?';
  const choices = [
    UserPermissionTypeOptions.AUTH_GUEST_USERS,
    UserPermissionTypeOptions.INDIVIDUAL_GROUPS,
    UserPermissionTypeOptions.BOTH,
    UserPermissionTypeOptions.LEARN_MORE,
  ];
  const selectedChoice = UserPermissionTypeOptions.AUTH_GUEST_USERS;
  const selectedIndex = getIndexOfChoice(choices, selectedChoice);
  const answer = await prompter.pick<'one', string>(message, choices, { initial: selectedIndex });
  return answer as UserPermissionTypeOptions;
}

export async function askUpdateTriggerSelection(
  currentTriggerFunction: string | undefined = undefined,
): Promise<S3CLITriggerUpdateMenuOptions> {
  let choices = [];
  if (currentTriggerFunction === undefined || currentTriggerFunction === 'NONE') {
    choices = [S3CLITriggerUpdateMenuOptions.ADD, S3CLITriggerUpdateMenuOptions.SKIP];
  } else {
    choices = [S3CLITriggerUpdateMenuOptions.UPDATE, S3CLITriggerUpdateMenuOptions.REMOVE, S3CLITriggerUpdateMenuOptions.SKIP];
  }
  const message = 'Select from the following options';
  const selectedChoice = S3CLITriggerUpdateMenuOptions.SKIP;
  const selectedIndex = getIndexOfChoice(choices, selectedChoice);
  const triggerOperationAnswer = await prompter.pick<'one', string>(message, choices, { initial: selectedIndex });
  return triggerOperationAnswer as S3CLITriggerUpdateMenuOptions;
}

export async function askAuthPermissionQuestion(context: $TSContext, defaultValues: S3UserInputs): Promise<S3PermissionType[]> {
  const permissions: S3PermissionType[] = await askCRUDQuestion(S3UserAccessRole.AUTH, undefined, context, defaultValues);
  return permissions;
}

export async function conditionallyAskGuestPermissionQuestion(
  storageAccess: S3AccessType | undefined,
  context: $TSContext,
  defaultValues: $TSAny,
): Promise<S3PermissionType[]> {
  if (storageAccess === S3AccessType.AUTH_AND_GUEST) {
    const permissions: S3PermissionType[] = await askCRUDQuestion(S3UserAccessRole.GUEST, undefined, context, defaultValues);
    return permissions;
  } else {
    return [];
  }
}

export async function askGroupPermissionQuestion(groupName: string, context: $TSContext, defaultValues: $TSAny) {
  const permissions: S3PermissionType[] = await askCRUDQuestion(S3UserAccessRole.GROUP, groupName, context, defaultValues);
  return permissions;
}

export async function askUserPoolGroupSelectionUntilPermissionSelected(
  userPoolGroupList: string[],
  context: $TSContext,
  userInput: S3UserInputs,
): Promise<string> {
  let permissionSelected = 'Auth/Guest Users';
  if (userPoolGroupList && userPoolGroupList.length > 0) {
    do {
      if (permissionSelected === 'Learn more') {
        printer.blankLine();
        printer.info(
          'You can restrict access using CRUD policies for Authenticated Users, Guest Users, or on individual Groups that users belong to in a User Pool. If a user logs into your application and is not a member of any group they will use policy set for “Authenticated Users”, however if they belong to a group they will only get the policy associated with that specific group.',
        );
        printer.blankLine();
      }
      permissionSelected = await askUserPoolGroupPermissionSelectionQuestion();
    } while (permissionSelected === 'Learn more');
  }
  return permissionSelected;
}

/**
 * askGroupOrIndividualAccessFlow asks user to select User-Pool-Group based or Auth/Guest based or Both
 * authentication mechanism for access to their Object store. On selection of permission types and permissions
 * it updates the cliInputs structure and returns.
 * @param userPoolGroupList : User pool groups created by Auth service
 * @param context : CLI walkthrough context
 * @param cliInputs : CLI Input structure to be Populated
 * @returns cliInputs asynchronously
 */
export async function askGroupOrIndividualAccessFlow(
  userPoolGroupList: Array<string>,
  context: $TSContext,
  cliInputs: S3UserInputs,
): Promise<S3UserInputs> {
  if (userPoolGroupList && userPoolGroupList.length > 0) {
    //Ask S3 walkthrough questions - UserPool Group selection questions
    const permissionSelected = await askUserPoolGroupSelectionUntilPermissionSelected(userPoolGroupList, context, cliInputs);

    if (permissionSelected === UserPermissionTypeOptions.BOTH || permissionSelected === UserPermissionTypeOptions.AUTH_GUEST_USERS) {
      //Build userInputs for S3 Auth/Guest users
      cliInputs.storageAccess = await askWhoHasAccessQuestion(context, cliInputs); //Auth/Guest
      cliInputs.authAccess = await askAuthPermissionQuestion(context, cliInputs);
      cliInputs.guestAccess = await conditionallyAskGuestPermissionQuestion(cliInputs.storageAccess, context, cliInputs);

      //Reset group-permissions if using auth/guest
      if (permissionSelected === UserPermissionTypeOptions.AUTH_GUEST_USERS) {
        cliInputs.groupAccess = undefined;
      }
    }

    if (permissionSelected === UserPermissionTypeOptions.BOTH || permissionSelected === UserPermissionTypeOptions.INDIVIDUAL_GROUPS) {
      //Remove all auth and guest access and only rely on Groups
      if (permissionSelected === UserPermissionTypeOptions.INDIVIDUAL_GROUPS) {
        cliInputs.authAccess = [];
        cliInputs.guestAccess = [];
      }
      //Update the group to select from
      const selectedUserPoolGroupList = await askUserPoolGroupSelectionQuestion(userPoolGroupList, context, cliInputs);
      //Ask Group Permissions and assign to cliInputs
      if (!cliInputs.groupAccess) {
        cliInputs.groupAccess = {};
      }
      if (selectedUserPoolGroupList && selectedUserPoolGroupList.length > 0) {
        for (const selectedGroup of selectedUserPoolGroupList) {
          cliInputs.groupAccess[selectedGroup] = await askGroupPermissionQuestion(selectedGroup, context, cliInputs);
        }
      }
    }
  }
  return cliInputs;
}

// If READ and LIST present then return READ else return the first permission
export function normalizePermissionsMapValue(permissionValue: Array<S3PermissionType>) {
  if (permissionValue.includes(S3PermissionType.READ)) {
    return S3PermissionType.READ;
  } else {
    return permissionValue[0];
  }
}

//Helper functions for prompter to get default-index array from default values.
function getIndexArray(choices: string[], selectedChoices: string[]): Array<number> {
  const selectedIndexes: Array<number> = [];
  for (const choice of selectedChoices) {
    const index = choices.indexOf(choice);
    if (index >= 0) {
      selectedIndexes.push(index);
    }
  }
  return selectedIndexes;
}

function getIndexArrayByValue(choices: { name: string; value: $TSAny }[], selectedChoiceValues: string[]): Array<number> {
  const selectedIndexes: Array<number> = [];
  const choiceValues = choices?.map(choice => choice.value);
  if (choiceValues) {
    for (const selectedChoiceValue of selectedChoiceValues) {
      const index = choiceValues.indexOf(selectedChoiceValue);
      if (index >= 0) {
        selectedIndexes.push(index);
      }
    }
  }
  return selectedIndexes;
}

function getIndexOfChoice(choices: string[], selectedChoice: string): number {
  return choices.indexOf(selectedChoice);
}
