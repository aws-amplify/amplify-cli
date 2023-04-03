"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAndroidProjectWithProfile = exports.initJSProjectWithProfileV4_52_0 = exports.initJSProjectWithProfileV4_28_2 = void 0;
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const os_1 = require("os");
const defaultSettings = {
    name: os_1.EOL,
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
};
function initJSProjectWithProfileV4_28_2(cwd, settings, testingWithLatestCodebase = false) {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    let env;
    if (s.disableAmplifyAppCreation === true) {
        env = {
            CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
        };
    }
    (0, amplify_e2e_core_1.addCircleCITags)(cwd);
    return new Promise((resolve, reject) => {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(testingWithLatestCodebase), ['init'], { cwd, stripColors: true, env })
            .wait('Enter a name for the project')
            .sendLine(s.name)
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
            .wait(/(Select the authentication method you want to use|Do you want to use an AWS profile)/)
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
exports.initJSProjectWithProfileV4_28_2 = initJSProjectWithProfileV4_28_2;
function initJSProjectWithProfileV4_52_0(cwd, settings, testingWithLatestCodebase = false) {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    let env;
    if (s.disableAmplifyAppCreation === true) {
        env = {
            CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
        };
    }
    (0, amplify_e2e_core_1.addCircleCITags)(cwd);
    return new Promise((resolve, reject) => {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(testingWithLatestCodebase), ['init'], { cwd, stripColors: true, env })
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
            .wait(/(Select the authentication method you want to use|Do you want to use an AWS profile)/)
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
exports.initJSProjectWithProfileV4_52_0 = initJSProjectWithProfileV4_52_0;
function initAndroidProjectWithProfile(cwd, settings) {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    (0, amplify_e2e_core_1.addCircleCITags)(cwd);
    return new Promise((resolve, reject) => {
        (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), ['init'], {
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
            .send('j')
            .sendCarriageReturn()
            .wait('Where is your Res directory')
            .sendCarriageReturn()
            .wait('Select the authentication method you want to use:')
            .sendCarriageReturn()
            .wait('Please choose the profile you want to use')
            .sendLine(s.profileName)
            .wait(/Try "amplify add api" to create a backend API and then "amplify (push|publish)" to deploy everything/)
            .run((err) => {
            if (!err) {
                (0, amplify_e2e_core_1.addCircleCITags)(cwd);
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.initAndroidProjectWithProfile = initAndroidProjectWithProfile;
//# sourceMappingURL=init.js.map