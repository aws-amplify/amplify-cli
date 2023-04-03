"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLambdaTrigger = exports.s3RemoveAdminLambdaTrigger = exports.s3RegisterAdminTrigger = exports.s3RemoveStorageLambdaTrigger = exports.s3AddStorageLambdaTrigger = exports.s3ValidateBucketName = exports.s3CreateStorageResource = exports.s3UpdateUserInput = exports.s3GetAdminTriggerFunctionName = exports.s3GetUserInput = exports.s3GetResourceName = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const s3_stack_transform_1 = require("../cdk-stack-builder/s3-stack-transform");
const s3_user_input_state_1 = require("./s3-user-input-state");
const s3_walkthrough_1 = require("./s3-walkthrough");
function s3GetResourceName() {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    let resourceName = undefined;
    if (amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE]) {
        const categoryResources = amplifyMeta[amplify_cli_core_1.AmplifyCategories.STORAGE];
        Object.keys(categoryResources).forEach((resource) => {
            if (categoryResources[resource].service === amplify_cli_core_1.AmplifySupportedService.S3) {
                resourceName = resource;
            }
        });
    }
    return resourceName;
}
exports.s3GetResourceName = s3GetResourceName;
async function s3GetUserInput(context, s3ResourceName) {
    if ((0, s3_walkthrough_1.isMigrateStorageRequired)(context, s3ResourceName)) {
        await (0, s3_walkthrough_1.migrateStorageCategory)(context, s3ResourceName);
    }
    const cliInputsState = new s3_user_input_state_1.S3InputState(context, s3ResourceName, undefined);
    return cliInputsState.getUserInput();
}
exports.s3GetUserInput = s3GetUserInput;
async function s3GetAdminTriggerFunctionName(context) {
    var _a;
    const s3ResourceName = await s3GetResourceName();
    const s3UserInput = s3ResourceName ? await s3GetUserInput(context, s3ResourceName) : undefined;
    return (_a = s3UserInput === null || s3UserInput === void 0 ? void 0 : s3UserInput.adminTriggerFunction) === null || _a === void 0 ? void 0 : _a.triggerFunction;
}
exports.s3GetAdminTriggerFunctionName = s3GetAdminTriggerFunctionName;
async function s3UpdateUserInput(context, storageInput) {
    await s3APIHelperTransformAndSaveState(context, storageInput, amplify_cli_core_1.CLISubCommandType.UPDATE);
    return storageInput;
}
exports.s3UpdateUserInput = s3UpdateUserInput;
async function s3CreateStorageResource(context, storageInput) {
    const storageResourceName = s3GetResourceName();
    if (storageResourceName) {
        throw new Error('Add Storage Failed.. already exists');
    }
    if (storageInput.bucketName) {
        s3ValidateBucketName(storageInput.bucketName);
    }
    await s3APIHelperTransformAndSaveState(context, storageInput, amplify_cli_core_1.CLISubCommandType.ADD);
    return storageInput;
}
exports.s3CreateStorageResource = s3CreateStorageResource;
function s3ValidateBucketName(bucketName) {
    const regexp = '^[a-z0-9-]{3,47}$';
    const isValidBucketName = new RegExp(regexp, 'g').test(bucketName);
    if (!isValidBucketName) {
        throw new Error('Bucket name can only use the following characters: a-z 0-9 - and should have minimum 3 character and max of 47 character');
    }
    return true;
}
exports.s3ValidateBucketName = s3ValidateBucketName;
async function s3AddStorageLambdaTrigger(context, s3ResourceName, storageLambdaTrigger) {
    const cliInputsState = new s3_user_input_state_1.S3InputState(context, s3ResourceName, undefined);
    if (!cliInputsState.cliInputFileExists()) {
        throw new Error(`Error Adding trigger function on storage resource ${s3ResourceName} : resource does not exist`);
    }
    const s3UserInput = cliInputsState.getUserInput();
    s3UserInput.triggerFunction = storageLambdaTrigger.triggerFunction;
    await cliInputsState.saveCliInputPayload(s3UserInput);
    await (0, s3_walkthrough_1.createNewLambdaAndUpdateCFN)(context, s3UserInput.triggerFunction, undefined);
    await s3APIHelperTransformAndSaveState(context, s3UserInput, amplify_cli_core_1.CLISubCommandType.UPDATE);
    return s3UserInput;
}
exports.s3AddStorageLambdaTrigger = s3AddStorageLambdaTrigger;
async function s3RemoveStorageLambdaTrigger(context, s3ResourceName) {
    var _a;
    const cliInputsState = new s3_user_input_state_1.S3InputState(context, s3ResourceName, undefined);
    if (!cliInputsState.cliInputFileExists()) {
        throw new Error(`Error Adding trigger function on storage resource ${s3ResourceName} : resource does not exist`);
    }
    const s3UserInput = cliInputsState.getUserInput();
    if (((_a = s3UserInput.adminTriggerFunction) === null || _a === void 0 ? void 0 : _a.triggerFunction) === s3UserInput.triggerFunction) {
        throw new Error(`Error removing trigger function from storage resource ${s3ResourceName} : function used by ${amplify_cli_core_1.AmplifyCategories.PREDICTIONS}`);
    }
    s3UserInput.triggerFunction = undefined;
    await s3APIHelperTransformAndSaveState(context, s3UserInput, amplify_cli_core_1.CLISubCommandType.UPDATE);
}
exports.s3RemoveStorageLambdaTrigger = s3RemoveStorageLambdaTrigger;
async function s3RegisterAdminTrigger(context, s3ResourceName, adminLambdaTrigger) {
    const cliInputsState = new s3_user_input_state_1.S3InputState(context, s3ResourceName, undefined);
    if (!cliInputsState.cliInputFileExists()) {
        throw new Error(`Error Registering existing trigger function on storage resource ${s3ResourceName} : resource does not exist`);
    }
    const s3UserInput = cliInputsState.getUserInput();
    s3UserInput.adminTriggerFunction = adminLambdaTrigger;
    await s3APIHelperTransformAndSaveState(context, s3UserInput, amplify_cli_core_1.CLISubCommandType.UPDATE);
    return s3UserInput;
}
exports.s3RegisterAdminTrigger = s3RegisterAdminTrigger;
async function s3RemoveAdminLambdaTrigger(context, s3ResourceName) {
    const cliInputsState = new s3_user_input_state_1.S3InputState(context, s3ResourceName, undefined);
    if (!cliInputsState.cliInputFileExists()) {
        throw new Error(`Error Registering existing trigger function on storage resource ${s3ResourceName} : resource does not exist`);
    }
    const s3UserInput = cliInputsState.getUserInput();
    s3UserInput.adminTriggerFunction = undefined;
    await s3APIHelperTransformAndSaveState(context, s3UserInput, amplify_cli_core_1.CLISubCommandType.UPDATE);
    return s3UserInput;
}
exports.s3RemoveAdminLambdaTrigger = s3RemoveAdminLambdaTrigger;
async function addLambdaTrigger(context, s3ResourceName, triggerFunctionParams) {
    const cliInputsState = new s3_user_input_state_1.S3InputState(context, s3ResourceName, undefined);
    if (!cliInputsState.cliInputFileExists()) {
        cliInputsState.addAdditionalLambdaTrigger(triggerFunctionParams);
        const stackGenerator = new s3_stack_transform_1.AmplifyS3ResourceStackTransform(s3ResourceName, context);
        await stackGenerator.transform(amplify_cli_core_1.CLISubCommandType.UPDATE);
        return stackGenerator.getCFN();
    }
    else {
        throw new Error(`Error Adding trigger function on storage resource ${s3ResourceName} : resource does not exist`);
    }
}
exports.addLambdaTrigger = addLambdaTrigger;
async function s3APIHelperTransformAndSaveState(context, storageInput, phase) {
    if (phase != amplify_cli_core_1.CLISubCommandType.ADD && (0, s3_walkthrough_1.isMigrateStorageRequired)(context, storageInput.resourceName)) {
        await (0, s3_walkthrough_1.migrateStorageCategory)(context, storageInput.resourceName);
    }
    let cliInputsState;
    if (phase === amplify_cli_core_1.CLISubCommandType.ADD) {
        cliInputsState = new s3_user_input_state_1.S3InputState(context, storageInput.resourceName, storageInput);
    }
    else {
        cliInputsState = new s3_user_input_state_1.S3InputState(context, storageInput.resourceName, undefined);
    }
    await cliInputsState.saveCliInputPayload(storageInput);
    const stackGenerator = new s3_stack_transform_1.AmplifyS3ResourceStackTransform(storageInput.resourceName, context);
    await stackGenerator.transform(phase);
    const dependsOn = stackGenerator.getS3DependsOn();
    if (phase == amplify_cli_core_1.CLISubCommandType.ADD) {
        context.amplify.updateamplifyMetaAfterResourceAdd(amplify_cli_core_1.AmplifyCategories.STORAGE, storageInput.resourceName, {
            service: amplify_cli_core_1.AmplifySupportedService.S3,
            providerPlugin: 'awscloudformation',
            dependsOn,
        });
    }
    else {
        context.amplify.updateamplifyMetaAfterResourceUpdate(amplify_cli_core_1.AmplifyCategories.STORAGE, storageInput.resourceName, 'dependsOn', dependsOn);
    }
}
//# sourceMappingURL=s3-resource-api.js.map