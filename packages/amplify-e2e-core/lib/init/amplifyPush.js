"use strict";
/* eslint-disable import/no-cycle */
/* eslint-disable max-depth */
/* eslint-disable max-lines-per-function */
/* eslint-disable prefer-const */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-await */
/* eslint-disable consistent-return */
/* eslint-disable no-continue */
/* eslint-disable max-len */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable func-style */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.amplifyPushOverride = exports.amplifyPushDestructiveApiUpdate = exports.amplifyPushWithNoChanges = exports.amplifyPushMissingFuncSecret = exports.amplifyPushMissingEnvVar = exports.amplifyPushIterativeRollback = exports.amplifyPushLayer = exports.amplifyPushUpdateForDependentModel = exports.amplifyPushFunction = exports.amplifyPushAuthV5V6 = exports.amplifyPushAuthV10 = exports.amplifyPushAuth = exports.amplifyPushUpdateLegacy = exports.amplifyPushUpdate = exports.amplifyPushSecretsWithoutCodegen = exports.amplifyPushWithoutCodegen = exports.cancelIterativeAmplifyPush = exports.amplifyPushForce = exports.amplifyPushGraphQlWithCognitoPrompt = exports.amplifyPushLegacy = exports.amplifyPush = void 0;
const __1 = require("..");
const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;
/**
 * Function to test amplify push with verbose status
 */
const amplifyPush = (cwd, testingWithLatestCodebase = false, opts) => __awaiter(void 0, void 0, void 0, function* () {
    // Test detailed status
    yield (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait(/.*/)
        .runAsync();
    const pushArgs = ['push', ...((opts === null || opts === void 0 ? void 0 : opts.minify) ? ['--minify'] : [])];
    // Test amplify push
    yield (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), pushArgs, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendYes()
        .wait('Do you want to generate code for your newly created GraphQL API')
        .sendConfirmNo()
        .wait(/.*/)
        .runAsync();
});
exports.amplifyPush = amplifyPush;
/**
 * Function to test amplify push with verbose status
 */
const amplifyPushLegacy = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    // Test detailed status
    yield (0, __1.nspawn)((0, __1.getCLIPath)(false), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS }).wait(/.*/).runAsync();
    // Test amplify push
    yield (0, __1.nspawn)((0, __1.getCLIPath)(false), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendConfirmYes()
        .wait('Do you want to generate code for your newly created GraphQL API')
        .sendConfirmNo()
        .wait(/.*/)
        .runAsync();
});
exports.amplifyPushLegacy = amplifyPushLegacy;
/**
 * Function to test amplify push with codegen for graphql API
 */
const amplifyPushGraphQlWithCognitoPrompt = (cwd, testingWithLatestCodebase = false) => __awaiter(void 0, void 0, void 0, function* () {
    // Test detailed status
    yield (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait(/.*/)
        .runAsync();
    // Test amplify push
    yield (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendYes()
        .wait(/.*Do you want to use the default authentication and security configuration.*/)
        .sendCarriageReturn()
        .wait(/.*How do you want users to be able to sign in.*/)
        .sendCarriageReturn()
        .wait(/.*Do you want to configure advanced settings.*/)
        .sendCarriageReturn()
        .wait('Do you want to generate code for your newly created GraphQL API')
        .sendConfirmNo()
        .wait(/.*/)
        .runAsync();
});
exports.amplifyPushGraphQlWithCognitoPrompt = amplifyPushGraphQlWithCognitoPrompt;
/**
 * Function to test amplify push with force push flag --force
 */
const amplifyPushForce = (cwd, testingWithLatestCodebase = false) => (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['push', '--force'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait(/.*/)
    .runAsync();
exports.amplifyPushForce = amplifyPushForce;
/**
 * * Used to stop an iterative deployment
 * * Waits on the table stack to be complete and for the next stack to update in order to cancel the push
 */
function cancelIterativeAmplifyPush(cwd, idx, testingWithLatestCodebase = false) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendYes()
        .wait(`Deploying iterative update ${idx.current} of ${idx.max} into`)
        .wait(/.*AWS::AppSync::GraphQLSchema\s*UPDATE_IN_PROGRESS.*/)
        .sendCtrlC()
        .runAsync((err) => err.message === 'Process exited with non zero exit code 130');
}
exports.cancelIterativeAmplifyPush = cancelIterativeAmplifyPush;
/**
 * Function to test amplify push without codegen prompt
 */
const amplifyPushWithoutCodegen = (cwd, testingWithLatestCodebase = false, allowDestructiveUpdates = false) => __awaiter(void 0, void 0, void 0, function* () {
    const args = ['push'];
    if (allowDestructiveUpdates) {
        args.push('--allow-destructive-graphql-schema-updates');
    }
    return (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), args, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendCarriageReturn()
        .runAsync();
});
exports.amplifyPushWithoutCodegen = amplifyPushWithoutCodegen;
/**
 * Function to test amplify push with function secrets without codegen prompt
 */
function amplifyPushSecretsWithoutCodegen(cwd, testingWithLatestCodebase = false) {
    const args = ['push'];
    return (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), args, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendCarriageReturn()
        .wait('Secret configuration detected. Do you wish to store new values in the cloud?')
        .sendConfirmYes()
        .runAsync();
}
exports.amplifyPushSecretsWithoutCodegen = amplifyPushSecretsWithoutCodegen;
/**
 * Function to test amplify push with allowDestructiveUpdates flag option
 */
function amplifyPushUpdate(cwd, waitForText, testingWithLatestCodebase = false, allowDestructiveUpdates = false, overridePushTimeoutMS = 0, minify) {
    const args = ['push'];
    if (allowDestructiveUpdates) {
        args.push('--allow-destructive-graphql-schema-updates');
    }
    if (minify) {
        args.push('--minify');
    }
    return (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), args, {
        cwd,
        stripColors: true,
        noOutputTimeout: overridePushTimeoutMS || pushTimeoutMS,
    })
        .wait('Are you sure you want to continue?')
        .sendYes()
        .wait(waitForText || /.*/)
        .runAsync();
}
exports.amplifyPushUpdate = amplifyPushUpdate;
/**
 * Function to test amplify push with allowDestructiveUpdates flag option
 */
function amplifyPushUpdateLegacy(cwd, waitForText, allowDestructiveUpdates = false, overridePushTimeoutMS = 0) {
    const args = ['push'];
    if (allowDestructiveUpdates) {
        args.push('--allow-destructive-graphql-schema-updates');
    }
    return (0, __1.nspawn)((0, __1.getCLIPath)(false), args, { cwd, stripColors: true, noOutputTimeout: overridePushTimeoutMS || pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendConfirmYes()
        .wait(waitForText || /.*/)
        .runAsync();
}
exports.amplifyPushUpdateLegacy = amplifyPushUpdateLegacy;
/**
 * Function to test amplify push
 */
const amplifyPushAuth = (cwd, testingWithLatestCodebase = false) => (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait(/.*/)
    .runAsync();
exports.amplifyPushAuth = amplifyPushAuth;
/**
 * Function to test amplify push
 */
const amplifyPushAuthV10 = (cwd, testingWithLatestCodebase = false) => (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendConfirmYes()
    .wait(/.*/)
    .runAsync();
exports.amplifyPushAuthV10 = amplifyPushAuthV10;
/**
 * To be used in migrations tests only
 */
const amplifyPushAuthV5V6 = (cwd) => (0, __1.nspawn)((0, __1.getCLIPath)(false), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendConfirmYes()
    .wait(/.*/)
    .runAsync();
exports.amplifyPushAuthV5V6 = amplifyPushAuthV5V6;
/**
 * amplify push command for pushing functions
 * @param cwd : current working directory
 * @param testingWithLatestCode : boolean flag
 * @returns void
 */
const amplifyPushFunction = (cwd, testingWithLatestCode = false) => __awaiter(void 0, void 0, void 0, function* () {
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCode), ['push', 'function'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendCarriageReturn();
    return chain.runAsync();
});
exports.amplifyPushFunction = amplifyPushFunction;
/**
 * Function to test amplify push with allowDestructiveUpdates flag and when dependent function is removed from schema.graphql
 */
function amplifyPushUpdateForDependentModel(cwd, testingWithLatestCodebase = false, allowDestructiveUpdates = false) {
    const args = ['push'];
    if (allowDestructiveUpdates) {
        args.push('--allow-destructive-graphql-schema-updates');
    }
    return (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), args, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendYes()
        .wait(/.*/)
        .wait('Do you want to remove the GraphQL model access on these affected functions?')
        .sendConfirmYes()
        .wait(/.*/)
        .runAsync();
}
exports.amplifyPushUpdateForDependentModel = amplifyPushUpdateForDependentModel;
/**
 * Function to test amplify push when deploying a layer
 * * this function expects a single layer's content to be modified
 */
const amplifyPushLayer = (cwd, settings, testingWithLatestCodebase = false) => {
    const defaultSettings = {
        acceptSuggestedLayerVersionConfigurations: true,
        migrateLegacyLayer: false,
        usePreviousPermissions: true,
    };
    const effectiveSettings = Object.assign(Object.assign({}, defaultSettings), settings);
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendYes();
    if (settings.migrateLegacyLayer === true) {
        chain
            .wait('Amplify updated the way Lambda layers work to better support team workflows and additional features.')
            .wait('Continue?')
            .sendConfirmYes();
    }
    chain.wait('Suggested configuration for new layer versions:').wait('Accept the suggested layer version configurations?');
    if (effectiveSettings.acceptSuggestedLayerVersionConfigurations === true) {
        chain.sendConfirmYes();
    }
    else {
        chain.sendConfirmNo();
        chain.wait('What permissions do you want to grant to this new layer version');
        if (effectiveSettings.usePreviousPermissions === true) {
            chain.sendCarriageReturn(); // The same permission as the latest layer version
        }
        else {
            chain.sendKeyDown().sendCarriageReturn(); // Only accessible by the current account. You can always edit this later with: amplify update function
        }
        // Description prompt
        chain.wait('Description');
        if (effectiveSettings.layerDescription) {
            chain.sendLine(effectiveSettings.layerDescription);
        }
        else {
            // Accept default description
            chain.sendCarriageReturn();
        }
    }
    return chain.runAsync();
};
exports.amplifyPushLayer = amplifyPushLayer;
/**
 * Function to test amplify push with iterativeRollback flag option
 */
const amplifyPushIterativeRollback = (cwd, testingWithLatestCodebase = false) => (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['push', '--iterative-rollback'], { cwd, stripColors: true })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .runAsync();
exports.amplifyPushIterativeRollback = amplifyPushIterativeRollback;
/**
 * Function to test amplify push with missing environment variable
 */
const amplifyPushMissingEnvVar = (cwd, newEnvVarValue) => (0, __1.nspawn)((0, __1.getCLIPath)(), ['push'], { cwd, stripColors: true })
    .wait('Enter the missing environment variable value of')
    .sendLine(newEnvVarValue)
    .wait('Are you sure you want to continue?')
    .sendYes()
    .runAsync();
exports.amplifyPushMissingEnvVar = amplifyPushMissingEnvVar;
/**
 * Function to test amplify push with missing function secrets
 */
const amplifyPushMissingFuncSecret = (cwd, newSecretValue) => (0, __1.nspawn)((0, __1.getCLIPath)(), ['push'], { cwd, stripColors: true })
    .wait('does not have a value in this environment. Specify one now:')
    .sendLine(newSecretValue)
    .wait('Are you sure you want to continue?')
    .sendYes()
    .runAsync();
exports.amplifyPushMissingFuncSecret = amplifyPushMissingFuncSecret;
/**
 * Function to test amplify push with no changes in the resources
 */
const amplifyPushWithNoChanges = (cwd, testingWithLatestCodebase = false) => (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('No changes detected')
    .runAsync();
exports.amplifyPushWithNoChanges = amplifyPushWithNoChanges;
/**
 * Function to test amplify push with destructive updates on the API models
 */
const amplifyPushDestructiveApiUpdate = (cwd, includeForce) => {
    const args = ['push', '--yes'];
    if (includeForce) {
        args.push('--force');
    }
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), args, { cwd, stripColors: true });
    if (includeForce) {
        return chain.runAsync();
    }
    else {
        chain.wait('If this is intended, rerun the command with'); // in this case, we expect the CLI to error out
        return chain.runAsync((err) => !!err);
    }
};
exports.amplifyPushDestructiveApiUpdate = amplifyPushDestructiveApiUpdate;
/**
 * Function to test amplify push with overrides functionality
 */
const amplifyPushOverride = (cwd, testingWithLatestCodebase = false) => __awaiter(void 0, void 0, void 0, function* () {
    // Test detailed status
    yield (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait(/.*/)
        .runAsync();
    // Test amplify push
    yield (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
        .wait('Are you sure you want to continue?')
        .sendConfirmYes()
        .wait(/.*/)
        .runAsync();
});
exports.amplifyPushOverride = amplifyPushOverride;
//# sourceMappingURL=amplifyPush.js.map