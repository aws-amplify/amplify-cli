"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePermissionsMapValue = exports.askGroupOrIndividualAccessFlow = exports.askUserPoolGroupSelectionUntilPermissionSelected = exports.askGroupPermissionQuestion = exports.conditionallyAskGuestPermissionQuestion = exports.askAuthPermissionQuestion = exports.askUpdateTriggerSelection = exports.askUserPoolGroupPermissionSelectionQuestion = exports.askUserPoolGroupSelectionQuestion = exports.askCRUDQuestion = exports.askWhoHasAccessQuestion = exports.askBucketNameQuestion = exports.askResourceNameQuestion = exports.askAndInvokeAuthWorkflow = exports.askSelectExistingFunctionToAddTrigger = exports.askTriggerFunctionTypeQuestion = exports.askAndOpenFunctionEditor = exports.possibleCRUDOperations = exports.UserPermissionTypeOptions = exports.S3CLITriggerUpdateMenuOptions = exports.permissionMap = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const s3_user_input_types_1 = require("../service-walkthrough-types/s3-user-input-types");
const s3_walkthrough_1 = require("./s3-walkthrough");
const path_1 = __importDefault(require("path"));
exports.permissionMap = {
    'create/update': [s3_user_input_types_1.S3PermissionType.CREATE_AND_UPDATE],
    read: [s3_user_input_types_1.S3PermissionType.READ],
    delete: [s3_user_input_types_1.S3PermissionType.DELETE],
};
var S3CLITriggerUpdateMenuOptions;
(function (S3CLITriggerUpdateMenuOptions) {
    S3CLITriggerUpdateMenuOptions["ADD"] = "Add the Trigger";
    S3CLITriggerUpdateMenuOptions["UPDATE"] = "Update the Trigger";
    S3CLITriggerUpdateMenuOptions["REMOVE"] = "Remove the Trigger";
    S3CLITriggerUpdateMenuOptions["SKIP"] = "Skip Question";
})(S3CLITriggerUpdateMenuOptions = exports.S3CLITriggerUpdateMenuOptions || (exports.S3CLITriggerUpdateMenuOptions = {}));
var UserPermissionTypeOptions;
(function (UserPermissionTypeOptions) {
    UserPermissionTypeOptions["AUTH_GUEST_USERS"] = "Auth/Guest Users";
    UserPermissionTypeOptions["INDIVIDUAL_GROUPS"] = "Individual Groups";
    UserPermissionTypeOptions["BOTH"] = "Both";
    UserPermissionTypeOptions["LEARN_MORE"] = "Learn more";
})(UserPermissionTypeOptions = exports.UserPermissionTypeOptions || (exports.UserPermissionTypeOptions = {}));
exports.possibleCRUDOperations = Object.keys(exports.permissionMap).map((el) => ({
    name: el,
    value: normalizePermissionsMapValue(exports.permissionMap[el]),
}));
async function askAndOpenFunctionEditor(context, functionName) {
    const targetDir = context.amplify.pathManager.getBackendDirPath();
    if (await amplify_prompts_1.prompter.confirmContinue(`Do you want to edit the local ${functionName} lambda function now?`)) {
        await context.amplify.openEditor(context, path_1.default.join(targetDir, 'function', functionName, 'src', 'index.js'));
    }
}
exports.askAndOpenFunctionEditor = askAndOpenFunctionEditor;
async function askTriggerFunctionTypeQuestion() {
    const message = 'Select from the following options';
    const choices = [s3_user_input_types_1.S3TriggerFunctionType.EXISTING_FUNCTION, s3_user_input_types_1.S3TriggerFunctionType.NEW_FUNCTION];
    const triggerTypeAnswer = await amplify_prompts_1.prompter.pick(message, choices);
    return triggerTypeAnswer;
}
exports.askTriggerFunctionTypeQuestion = askTriggerFunctionTypeQuestion;
async function askSelectExistingFunctionToAddTrigger(choicesLambdaResources) {
    const message = 'Select from the following options';
    const selectedLambdaResourceName = await amplify_prompts_1.prompter.pick(message, choicesLambdaResources);
    return selectedLambdaResourceName;
}
exports.askSelectExistingFunctionToAddTrigger = askSelectExistingFunctionToAddTrigger;
async function askAndInvokeAuthWorkflow(context) {
    while (!(0, s3_walkthrough_1.checkIfAuthExists)()) {
        const shouldAddAuth = await amplify_prompts_1.prompter.yesOrNo('You need to add auth (Amazon Cognito) to your project in order to add storage for user files. Do you want to add auth now?', true);
        if (shouldAddAuth) {
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
            break;
        }
        else {
            void context.usageData.emitSuccess();
            (0, amplify_cli_core_1.exitOnNextTick)(0);
        }
    }
}
exports.askAndInvokeAuthWorkflow = askAndInvokeAuthWorkflow;
async function askResourceNameQuestion(context, defaultValues) {
    const message = 'Provide a friendly name for your resource that will be used to label this category in the project:';
    const defaultResourceName = defaultValues['resourceName'];
    const onErrorMsg = 'Resource name should be alphanumeric';
    const resourceName = await amplify_prompts_1.prompter.input(message, { validate: (0, amplify_prompts_1.alphanumeric)(onErrorMsg), initial: defaultResourceName });
    return resourceName;
}
exports.askResourceNameQuestion = askResourceNameQuestion;
async function askBucketNameQuestion(context, defaultValues) {
    const message = 'Provide bucket name:';
    const onErrorMsg = 'Bucket name can only use the following characters: a-z 0-9 - and should have minimum 3 character and max of 47 character';
    const validator = (0, amplify_prompts_1.and)([(0, amplify_prompts_1.matchRegex)(/^[a-z0-9-]+$/), (0, amplify_prompts_1.minLength)(3), (0, amplify_prompts_1.maxLength)(47)], onErrorMsg);
    const bucketName = await amplify_prompts_1.prompter.input(message, { validate: validator, initial: defaultValues['bucketName'] });
    return bucketName;
}
exports.askBucketNameQuestion = askBucketNameQuestion;
function getChoiceIndexByValue(choices, value) {
    const choiceValues = choices.map((choice) => choice.value);
    return choiceValues.indexOf(value);
}
async function askWhoHasAccessQuestion(context, defaultValues) {
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
    const answer = await amplify_prompts_1.prompter.pick(message, choices, { initial: selectedIndex });
    return answer;
}
exports.askWhoHasAccessQuestion = askWhoHasAccessQuestion;
function normalizeUserRole(role, groupName) {
    switch (role) {
        case s3_user_input_types_1.S3UserAccessRole.AUTH: {
            return 'Authenticated';
        }
        case s3_user_input_types_1.S3UserAccessRole.GUEST: {
            return s3_user_input_types_1.S3UserAccessRole.GUEST;
        }
        case s3_user_input_types_1.S3UserAccessRole.GROUP: {
            return groupName;
        }
    }
    return undefined;
}
async function askCRUDQuestion(role, groupName = undefined, context, defaultValues) {
    const roleDefaultValues = (0, s3_user_input_types_1.getRoleAccessDefaultValues)(role, groupName, defaultValues);
    const userRole = normalizeUserRole(role, groupName);
    const message = `What kind of access do you want for ${userRole} users?`;
    const choices = exports.possibleCRUDOperations;
    const initialIndexes = getIndexArrayByValue(exports.possibleCRUDOperations, roleDefaultValues);
    let selectedPermissions;
    do {
        selectedPermissions = await amplify_prompts_1.prompter.pick(message, choices, { returnSize: 'many', initial: initialIndexes });
        if (!selectedPermissions || selectedPermissions.length <= 0) {
            amplify_prompts_1.printer.warn('Select at least one option');
        }
    } while (!selectedPermissions || selectedPermissions.length <= 0);
    return selectedPermissions;
}
exports.askCRUDQuestion = askCRUDQuestion;
async function askUserPoolGroupSelectionQuestion(userPoolGroupList, context, defaultValues) {
    const message = 'Select groups:';
    const choices = userPoolGroupList;
    const selectedChoices = defaultValues.groupAccess ? Object.keys(defaultValues.groupAccess) : [];
    const selectedIndexes = selectedChoices ? getIndexArray(choices, selectedChoices) : undefined;
    const userPoolGroups = await amplify_prompts_1.prompter.pick(message, choices, { returnSize: 'many', initial: selectedIndexes });
    if (Array.isArray(userPoolGroups)) {
        return userPoolGroups;
    }
    else {
        return [userPoolGroups];
    }
}
exports.askUserPoolGroupSelectionQuestion = askUserPoolGroupSelectionQuestion;
async function askUserPoolGroupPermissionSelectionQuestion() {
    const message = 'Restrict access by?';
    const choices = [
        UserPermissionTypeOptions.AUTH_GUEST_USERS,
        UserPermissionTypeOptions.INDIVIDUAL_GROUPS,
        UserPermissionTypeOptions.BOTH,
        UserPermissionTypeOptions.LEARN_MORE,
    ];
    const selectedChoice = UserPermissionTypeOptions.AUTH_GUEST_USERS;
    const selectedIndex = getIndexOfChoice(choices, selectedChoice);
    const answer = await amplify_prompts_1.prompter.pick(message, choices, { initial: selectedIndex });
    return answer;
}
exports.askUserPoolGroupPermissionSelectionQuestion = askUserPoolGroupPermissionSelectionQuestion;
async function askUpdateTriggerSelection(currentTriggerFunction = undefined) {
    let choices = [];
    if (currentTriggerFunction === undefined || currentTriggerFunction === 'NONE') {
        choices = [S3CLITriggerUpdateMenuOptions.ADD, S3CLITriggerUpdateMenuOptions.SKIP];
    }
    else {
        choices = [S3CLITriggerUpdateMenuOptions.UPDATE, S3CLITriggerUpdateMenuOptions.REMOVE, S3CLITriggerUpdateMenuOptions.SKIP];
    }
    const message = 'Select from the following options';
    const selectedChoice = S3CLITriggerUpdateMenuOptions.SKIP;
    const selectedIndex = getIndexOfChoice(choices, selectedChoice);
    const triggerOperationAnswer = await amplify_prompts_1.prompter.pick(message, choices, { initial: selectedIndex });
    return triggerOperationAnswer;
}
exports.askUpdateTriggerSelection = askUpdateTriggerSelection;
async function askAuthPermissionQuestion(context, defaultValues) {
    const permissions = await askCRUDQuestion(s3_user_input_types_1.S3UserAccessRole.AUTH, undefined, context, defaultValues);
    return permissions;
}
exports.askAuthPermissionQuestion = askAuthPermissionQuestion;
async function conditionallyAskGuestPermissionQuestion(storageAccess, context, defaultValues) {
    if (storageAccess === s3_user_input_types_1.S3AccessType.AUTH_AND_GUEST) {
        const permissions = await askCRUDQuestion(s3_user_input_types_1.S3UserAccessRole.GUEST, undefined, context, defaultValues);
        return permissions;
    }
    else {
        return [];
    }
}
exports.conditionallyAskGuestPermissionQuestion = conditionallyAskGuestPermissionQuestion;
async function askGroupPermissionQuestion(groupName, context, defaultValues) {
    const permissions = await askCRUDQuestion(s3_user_input_types_1.S3UserAccessRole.GROUP, groupName, context, defaultValues);
    return permissions;
}
exports.askGroupPermissionQuestion = askGroupPermissionQuestion;
async function askUserPoolGroupSelectionUntilPermissionSelected(userPoolGroupList) {
    let permissionSelected = 'Auth/Guest Users';
    if (userPoolGroupList && userPoolGroupList.length > 0) {
        do {
            if (permissionSelected === 'Learn more') {
                amplify_prompts_1.printer.blankLine();
                amplify_prompts_1.printer.info('You can restrict access using CRUD policies for Authenticated Users, Guest Users, or on individual Groups that users belong to in a User Pool. If a user logs into your application and is not a member of any group they will use policy set for “Authenticated Users”, however if they belong to a group they will only get the policy associated with that specific group.');
                amplify_prompts_1.printer.blankLine();
            }
            permissionSelected = await askUserPoolGroupPermissionSelectionQuestion();
        } while (permissionSelected === 'Learn more');
    }
    return permissionSelected;
}
exports.askUserPoolGroupSelectionUntilPermissionSelected = askUserPoolGroupSelectionUntilPermissionSelected;
async function askGroupOrIndividualAccessFlow(userPoolGroupList, context, cliInputs) {
    if (userPoolGroupList && userPoolGroupList.length > 0) {
        const permissionSelected = await askUserPoolGroupSelectionUntilPermissionSelected(userPoolGroupList);
        if (permissionSelected === UserPermissionTypeOptions.BOTH || permissionSelected === UserPermissionTypeOptions.AUTH_GUEST_USERS) {
            cliInputs.storageAccess = await askWhoHasAccessQuestion(context, cliInputs);
            cliInputs.authAccess = await askAuthPermissionQuestion(context, cliInputs);
            cliInputs.guestAccess = await conditionallyAskGuestPermissionQuestion(cliInputs.storageAccess, context, cliInputs);
            if (permissionSelected === UserPermissionTypeOptions.AUTH_GUEST_USERS) {
                cliInputs.groupAccess = undefined;
            }
        }
        if (permissionSelected === UserPermissionTypeOptions.BOTH || permissionSelected === UserPermissionTypeOptions.INDIVIDUAL_GROUPS) {
            if (permissionSelected === UserPermissionTypeOptions.INDIVIDUAL_GROUPS) {
                cliInputs.authAccess = [];
                cliInputs.guestAccess = [];
            }
            const selectedUserPoolGroupList = await askUserPoolGroupSelectionQuestion(userPoolGroupList, context, cliInputs);
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
exports.askGroupOrIndividualAccessFlow = askGroupOrIndividualAccessFlow;
function normalizePermissionsMapValue(permissionValue) {
    if (permissionValue.includes(s3_user_input_types_1.S3PermissionType.READ)) {
        return s3_user_input_types_1.S3PermissionType.READ;
    }
    else {
        return permissionValue[0];
    }
}
exports.normalizePermissionsMapValue = normalizePermissionsMapValue;
function getIndexArray(choices, selectedChoices) {
    const selectedIndexes = [];
    for (const choice of selectedChoices) {
        const index = choices.indexOf(choice);
        if (index >= 0) {
            selectedIndexes.push(index);
        }
    }
    return selectedIndexes;
}
function getIndexArrayByValue(choices, selectedChoiceValues) {
    const selectedIndexes = [];
    const choiceValues = choices === null || choices === void 0 ? void 0 : choices.map((choice) => choice.value);
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
function getIndexOfChoice(choices, selectedChoice) {
    return choices.indexOf(selectedChoice);
}
//# sourceMappingURL=s3-questions.js.map