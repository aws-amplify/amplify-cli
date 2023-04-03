"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initJSProjectWithProfileV10 = void 0;
const amplify_e2e_core_1 = require("@aws-amplify/amplify-e2e-core");
const os_1 = require("os");
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
function initJSProjectWithProfileV10(cwd, settings) {
    var _a;
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    let env;
    if (s.disableAmplifyAppCreation === true) {
        env = {
            CLI_DEV_INTERNAL_DISABLE_AMPLIFY_APP_CREATION: '1',
        };
    }
    (0, amplify_e2e_core_1.addCircleCITags)(cwd);
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
        const chain = (0, amplify_e2e_core_1.nspawn)((0, amplify_e2e_core_1.getCLIPath)(), cliArgs, {
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
exports.initJSProjectWithProfileV10 = initJSProjectWithProfileV10;
//# sourceMappingURL=init.js.map