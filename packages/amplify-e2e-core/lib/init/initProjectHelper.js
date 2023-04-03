"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initHeadless = exports.amplifyStatus = exports.amplifyStatusWithMigrate = exports.amplifyVersion = exports.amplifyInitSandbox = exports.updatedInitNewEnvWithProfile = exports.initNewEnvWithProfile = exports.initNewEnvWithAccessKey = exports.initProjectWithAccessKey = exports.initFlutterProjectWithProfile = exports.initIosProjectWithProfile = exports.createRandomName = exports.initAndroidProjectWithProfile = exports.initJSProjectWithProfile = void 0;
/* eslint-disable import/no-cycle */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
/* eslint-disable func-style */
const os_1 = require("os");
const uuid_1 = require("uuid");
const __1 = require("..");
const utils_1 = require("../utils");
const configure_1 = require("../configure");
const defaultSettings = {
    name: os_1.EOL,
    // eslint-disable-next-line spellcheck/spell-checker
    envName: 'integtest',
    editor: os_1.EOL,
    appType: os_1.EOL,
    framework: os_1.EOL,
    srcDir: os_1.EOL,
    distDir: os_1.EOL,
    buildCmd: os_1.EOL,
    startCmd: os_1.EOL,
    useProfile: os_1.EOL,
    profileName: os_1.EOL,
    region: process.env.CLI_REGION,
    local: false,
    disableAmplifyAppCreation: true,
    disableCIDetection: false,
    providerConfig: undefined,
    permissionsBoundaryArn: undefined,
};
function initJSProjectWithProfile(cwd, settings) {
    var _a;
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    let env;
    if (s.disableAmplifyAppCreation === true) {
        env = {
            CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
        };
    }
    (0, __1.addCircleCITags)(cwd);
    const cliArgs = ['init'];
    const providerConfigSpecified = !!s.providerConfig && typeof s.providerConfig === 'object';
    if (providerConfigSpecified) {
        cliArgs.push('--providers', JSON.stringify(s.providerConfig));
    }
    if (s.permissionsBoundaryArn) {
        cliArgs.push('--permissions-boundary', s.permissionsBoundaryArn);
    }
    if (((_a = s === null || s === void 0 ? void 0 : s.name) === null || _a === void 0 ? void 0 : _a.length) > 20)
        console.warn('Project names should not be longer than 20 characters. This may cause tests to break.');
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), cliArgs, {
            cwd,
            stripColors: true,
            env,
            disableCIDetection: s.disableCIDetection,
        })
            .wait('Enter a name for the project')
            .sendLine(s.name)
            .wait('Initialize the project with the above configuration?')
            .sendConfirmNo()
            .wait('Enter a name for the environment')
            .sendLine(s.envName)
            .wait('Choose your default editor:')
            .sendLine(s.editor)
            .wait("Choose the type of app that you're building")
            .sendLine(s.appType)
            .wait('What javascript framework are you using')
            .sendLine(s.framework)
            .wait('Source Directory Path:')
            .sendLine(s.srcDir)
            .wait('Distribution Directory Path:')
            .sendLine(s.distDir)
            .wait('Build Command:')
            .sendLine(s.buildCmd)
            .wait('Start Command:')
            .sendCarriageReturn();
        if (!providerConfigSpecified) {
            chain
                .wait('Using default provider  awscloudformation')
                .wait('Select the authentication method you want to use:')
                .sendCarriageReturn()
                .wait('Please choose the profile you want to use')
                .sendLine(s.profileName);
        }
        chain
            .wait('Help improve Amplify CLI by sharing non sensitive configurations on failures')
            .sendYes()
            .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
            .run((err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
exports.initJSProjectWithProfile = initJSProjectWithProfile;
function initAndroidProjectWithProfile(cwd, settings) {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    (0, __1.addCircleCITags)(cwd);
    let env;
    if (s.disableAmplifyAppCreation) {
        env = {
            CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
        };
    }
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['init'], {
            cwd,
            stripColors: true,
            env,
        })
            .wait('Enter a name for the project')
            .sendLine(s.name)
            .wait('Initialize the project with the above configuration?')
            .sendConfirmNo()
            .wait('Enter a name for the environment')
            .sendLine(s.envName)
            .wait('Choose your default editor:')
            .sendLine(s.editor)
            .wait("Choose the type of app that you're building")
            .send('j')
            .sendCarriageReturn()
            .wait('Where is your Res directory')
            .sendCarriageReturn()
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendLine(s.profileName)
            .wait('Help improve Amplify CLI by sharing non sensitive configurations on failures')
            .sendYes()
            .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
            .run((err) => {
            if (!err) {
                (0, __1.addCircleCITags)(cwd);
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.initAndroidProjectWithProfile = initAndroidProjectWithProfile;
function createRandomName() {
    const length = 20;
    const regExp = new RegExp('-', 'g');
    return (0, uuid_1.v4)().replace(regExp, '').substring(0, length);
}
exports.createRandomName = createRandomName;
function initIosProjectWithProfile(cwd, settings) {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    (0, __1.addCircleCITags)(cwd);
    let env;
    if (s.disableAmplifyAppCreation === true) {
        env = {
            CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
        };
    }
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['init'], {
            cwd,
            stripColors: true,
            env,
        })
            .wait('Enter a name for the project')
            .sendLine(s.name)
            .wait('Initialize the project with the above configuration?')
            .sendConfirmNo()
            .wait('Enter a name for the environment')
            .sendLine(s.envName)
            .wait('Choose your default editor:')
            .sendLine(s.editor)
            .wait("Choose the type of app that you're building")
            .sendKeyDown(3)
            .sendCarriageReturn()
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendLine(s.profileName)
            .wait('Help improve Amplify CLI by sharing non sensitive configurations on failures')
            .sendYes()
            .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
            .run((err) => {
            if (!err) {
                (0, __1.addCircleCITags)(cwd);
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.initIosProjectWithProfile = initIosProjectWithProfile;
function initFlutterProjectWithProfile(cwd, settings) {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    (0, __1.addCircleCITags)(cwd);
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['init'], { cwd, stripColors: true })
            .wait('Enter a name for the project')
            .sendLine(s.name)
            .wait('Initialize the project with the above configuration?')
            .sendConfirmNo()
            .wait('Enter a name for the environment')
            .sendLine(s.envName)
            .wait('Choose your default editor:')
            .sendLine(s.editor)
            .wait("Choose the type of app that you're building")
            .sendKeyDown(2)
            .sendCarriageReturn()
            .wait('Where do you want to store your configuration file')
            .sendLine('./lib/')
            .wait('Using default provider  awscloudformation')
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendLine(s.profileName);
        (0, __1.singleSelect)(chain, s.region, configure_1.amplifyRegions);
        chain
            .wait('Help improve Amplify CLI by sharing non sensitive configurations on failures')
            .sendYes()
            .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.initFlutterProjectWithProfile = initFlutterProjectWithProfile;
function initProjectWithAccessKey(cwd, settings) {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    (0, __1.addCircleCITags)(cwd);
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['init'], {
            cwd,
            stripColors: true,
            env: {
                CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
            },
        })
            .wait('Enter a name for the project')
            .sendLine(s.name)
            .wait('Initialize the project with the above configuration?')
            .sendConfirmNo()
            .wait('Enter a name for the environment')
            .sendLine(s.envName)
            .wait('Choose your default editor:')
            .sendLine(s.editor)
            .wait("Choose the type of app that you're building")
            .sendLine(s.appType)
            .wait('What javascript framework are you using')
            .sendLine(s.framework)
            .wait('Source Directory Path:')
            .sendLine(s.srcDir)
            .wait('Distribution Directory Path:')
            .sendLine(s.distDir)
            .wait('Build Command:')
            .sendLine(s.buildCmd)
            .wait('Start Command:')
            .sendCarriageReturn()
            .wait('Using default provider  awscloudformation')
            .wait('Select the authentication method you want to use:')
            .send(utils_1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .pauseRecording()
            .wait('accessKeyId')
            .sendLine(s.accessKeyId)
            .wait('secretAccessKey')
            .sendLine(s.secretAccessKey)
            .resumeRecording()
            .wait('region');
        (0, __1.singleSelect)(chain, s.region, configure_1.amplifyRegions);
        chain
            .wait('Help improve Amplify CLI by sharing non sensitive configurations on failures')
            .sendYes()
            .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.initProjectWithAccessKey = initProjectWithAccessKey;
function initNewEnvWithAccessKey(cwd, s) {
    (0, __1.addCircleCITags)(cwd);
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['init'], {
            cwd,
            stripColors: true,
            env: {
                CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
            },
        })
            .wait('Do you want to use an existing environment?')
            .sendConfirmNo()
            .wait('Enter a name for the environment')
            .sendLine(s.envName)
            .wait('Using default provider  awscloudformation')
            .wait('Select the authentication method you want to use:')
            .send(utils_1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .pauseRecording()
            .wait('accessKeyId')
            .sendLine(s.accessKeyId)
            .wait('secretAccessKey')
            .sendLine(s.secretAccessKey)
            .resumeRecording()
            .wait('region');
        (0, __1.singleSelect)(chain, process.env.CLI_REGION, configure_1.amplifyRegions);
        chain.wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/).run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.initNewEnvWithAccessKey = initNewEnvWithAccessKey;
function initNewEnvWithProfile(cwd, s) {
    (0, __1.addCircleCITags)(cwd);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['init'], {
            cwd,
            stripColors: true,
            env: {
                CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
            },
        })
            .wait('Do you want to use an existing environment?')
            .sendConfirmNo()
            .wait('Enter a name for the environment')
            .sendLine(s.envName)
            .wait('Using default provider  awscloudformation')
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendCarriageReturn()
            .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.initNewEnvWithProfile = initNewEnvWithProfile;
function updatedInitNewEnvWithProfile(cwd, s) {
    (0, __1.addCircleCITags)(cwd);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['init'], {
            cwd,
            stripColors: true,
        })
            .wait('Enter a name for the environment')
            .sendLine(s.envName)
            .wait('Choose your default editor:')
            .sendCarriageReturn()
            .wait('Using default provider  awscloudformation')
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendCarriageReturn()
            .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.updatedInitNewEnvWithProfile = updatedInitNewEnvWithProfile;
function amplifyInitSandbox(cwd, settings) {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    let env;
    if (s.disableAmplifyAppCreation === true) {
        env = {
            CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
        };
    }
    (0, __1.addCircleCITags)(cwd);
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(), ['init'], { cwd, stripColors: true, env })
            .wait('Enter a name for the environment')
            .sendLine(s.envName)
            .wait('Choose your default editor:')
            .sendLine(s.editor)
            .wait('Using default provider  awscloudformation')
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendLine(s.profileName)
            .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyInitSandbox = amplifyInitSandbox;
function amplifyVersion(cwd, expectedVersion, testingWithLatestCodebase = false) {
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['--version'], { cwd, stripColors: true })
            .wait(expectedVersion)
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyVersion = amplifyVersion;
// Can be called only if detects team-provider-info change
function amplifyStatusWithMigrate(cwd, expectedStatus, testingWithLatestCodebase) {
    return new Promise((resolve, reject) => {
        const regex = new RegExp(`.*${expectedStatus}*`);
        (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['status'], { cwd, stripColors: true })
            .wait('Amplify has been upgraded to handle secrets more securely by migrating some values')
            .sendConfirmYes()
            .wait(regex)
            .sendCarriageReturn()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyStatusWithMigrate = amplifyStatusWithMigrate;
function amplifyStatus(cwd, expectedStatus, testingWithLatestCodebase = false) {
    return new Promise((resolve, reject) => {
        const regex = new RegExp(`.*${expectedStatus}*`);
        (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['status'], { cwd, stripColors: true })
            .wait(regex)
            .sendCarriageReturn()
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyStatus = amplifyStatus;
function initHeadless(cwd, envName, appId) {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['init', '--yes', '--envName', envName, '--appId', appId], { cwd, stripColors: true }).runAsync();
}
exports.initHeadless = initHeadless;
//# sourceMappingURL=initProjectHelper.js.map