"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amplifyStudioHeadlessPull = exports.amplifyPullNonInteractive = exports.amplifyPullSandbox = exports.amplifyPull = void 0;
// eslint-disable-next-line import/no-cycle
const __1 = require("..");
/**
 * Interactive amplify pull
 */
const amplifyPull = (cwd, settings, testingWithLatestCodebase = false) => {
    // Note:- Table checks have been removed since they are not necessary for push/pull flows and prone to breaking because
    // of stylistic changes. A simpler content based check will be added in the future.
    const args = ['pull'];
    if (settings.appId) {
        args.push('--appId', settings.appId);
    }
    if (settings.envName) {
        args.push('--envName', settings.envName);
    }
    if (settings.withRestore) {
        args.push('--restore');
    }
    if (settings.yesFlag) {
        args.push('--yes');
    }
    if (settings.emptyDir && settings.yesFlag) {
        const providerJson = JSON.stringify({ awscloudformation: (0, __1.getAwsProviderConfig)() });
        args.push('--providers');
        if (process.platform === 'win32') {
            // https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_parsing?view=powershell-7.3#the-stop-parsing-token
            args.push('--%');
        }
        args.push(providerJson);
    }
    const chain = (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), args, { cwd, stripColors: true });
    if (settings.emptyDir && !settings.yesFlag) {
        chain
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendCarriageReturn()
            .wait('Choose your default editor:')
            .sendCarriageReturn()
            .wait("Choose the type of app that you're building")
            .sendCarriageReturn()
            .wait('What javascript framework are you using')
            .sendCarriageReturn()
            .wait('Source Directory Path:')
            .sendCarriageReturn()
            .wait('Distribution Directory Path:')
            .sendCarriageReturn()
            .wait('Build Command:')
            .sendCarriageReturn()
            .wait('Start Command:')
            .sendCarriageReturn()
            .wait('Do you plan on modifying this backend?')
            .sendLine(settings.noUpdateBackend ? 'n' : 'y');
    }
    else if (!settings.noUpdateBackend && !settings.emptyDir) {
        chain.wait('Pre-pull status').wait('Current Environment');
    }
    if (settings.override) {
        chain
            .wait('Local changes detected')
            .wait('Pulling changes from the cloud will override your local changes')
            .wait('Are you sure you would like to continue')
            .sendConfirmYes();
    }
    if (settings.noUpdateBackend) {
        chain.wait('Added backend environment config object to your project.').wait("Run 'amplify pull' to sync future upstream changes.");
    }
    else if (settings.emptyDir) {
        chain.wait(/Successfully pulled backend environment .+ from the cloud\./);
        if (!settings.yesFlag) {
            chain.wait("Run 'amplify pull' to sync future upstream changes.");
        }
    }
    else {
        chain.wait('Post-pull status').wait('Current Environment');
    }
    return chain.runAsync();
};
exports.amplifyPull = amplifyPull;
/**
 * Interactive pull --sandboxId
 */
const amplifyPullSandbox = (cwd, settings) => {
    const args = ['pull', '--sandboxId', settings.sandboxId];
    return (0, __1.nspawn)((0, __1.getCLIPath)(), args, { cwd, stripColors: true })
        .wait('What type of app are you building')
        .sendKeyUp()
        .sendLine(settings.appType)
        .wait('What javascript framework are you using')
        .sendLine(settings.framework)
        .wait('Successfully generated models.')
        .runAsync();
};
exports.amplifyPullSandbox = amplifyPullSandbox;
/**
 * Run non-interactive amplify pull
 */
const amplifyPullNonInteractive = (cwd, settings) => {
    const { appId, envName, frontend } = settings;
    const amplifyParamObj = { appId, envName };
    const providersParamObj = {
        awscloudformation: {
            configLevel: 'project',
            useProfile: true,
            // eslint-disable-next-line spellcheck/spell-checker
            profileName: __1.TEST_PROFILE_NAME,
        },
    };
    const args = [
        'pull',
        '--amplify',
        JSON.stringify(amplifyParamObj),
        '--providers',
        JSON.stringify(providersParamObj),
        '--no-override',
        '--no-codegen',
        '--yes',
    ];
    if (frontend) {
        args.push('--frontend', JSON.stringify(frontend));
    }
    return (0, __1.nspawn)((0, __1.getCLIPath)(), args, { cwd, stripColors: true }).wait('Successfully pulled backend environment').runAsync();
};
exports.amplifyPullNonInteractive = amplifyPullNonInteractive;
/**
 * headless studio pull
 * instead of opening the browser for login pass the profile name so aws creds are used instead
 * accepts defaults by using yes flag
 *
 * if testing locally
 * set useDevCLI to `true`
 * use profile name in local aws config
 */
const amplifyStudioHeadlessPull = (cwd, settings) => {
    const { appId, envName, profileName, useDevCLI } = settings;
    const providersConfig = {
        awscloudformation: {
            configLevel: 'project',
            useProfile: true,
            // eslint-disable-next-line spellcheck/spell-checker
            profileName: profileName !== null && profileName !== void 0 ? profileName : 'amplify-integ-test-user',
        },
    };
    const args = ['pull', '--amplify', JSON.stringify({ appId, envName }), '--providers', JSON.stringify(providersConfig), '--yes'];
    return (0, __1.nspawn)((0, __1.getCLIPath)(useDevCLI), args, { cwd, stripColors: true }).wait('Successfully pulled backend environment').runAsync();
};
exports.amplifyStudioHeadlessPull = amplifyStudioHeadlessPull;
//# sourceMappingURL=amplifyPull.js.map