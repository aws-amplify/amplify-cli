"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amplifyConfigureProject = exports.amplifyConfigureBeforeOrAtV10_7 = exports.amplifyConfigure = exports.amplifyRegions = void 0;
const __1 = require("..");
const os_1 = require("os");
const defaultSettings = {
    profileName: 'amplify-integ-test-user',
    region: 'us-east-2',
    userName: os_1.EOL,
};
exports.amplifyRegions = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-north-1',
    'eu-south-1',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-central-1',
    'ap-northeast-1',
    'ap-northeast-2',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-south-1',
    'ca-central-1',
    'me-south-1',
    'sa-east-1',
];
const configurationOptions = ['Project information', 'AWS Profile setting', 'Advanced: Container-based deployments'];
const profileOptions = ['No', 'Update AWS Profile', 'Remove AWS Profile'];
const authenticationOptions = ['AWS profile', 'AWS access keys'];
const MANDATORY_PARAMS = ['accessKeyId', 'secretAccessKey', 'region'];
function amplifyConfigure(settings) {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    const missingParam = MANDATORY_PARAMS.filter((p) => !Object.keys(s).includes(p));
    if (missingParam.length) {
        throw new Error(`mandatory params ${missingParam.join(' ')} are missing`);
    }
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['configure'], { stripColors: true })
            .wait('Sign in to your AWS administrator account:')
            .wait('Press Enter to continue')
            .sendCarriageReturn()
            .wait('Specify the AWS Region');
        (0, __1.singleSelect)(chain, s.region, exports.amplifyRegions);
        chain
            .wait('Press Enter to continue')
            .sendCarriageReturn()
            .wait('accessKeyId')
            .pauseRecording()
            .sendLine(s.accessKeyId)
            .wait('secretAccessKey')
            .sendLine(s.secretAccessKey)
            .resumeRecording()
            .wait('Profile Name:')
            .sendLine(s.profileName)
            .wait('Successfully set up the new user.')
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
exports.amplifyConfigure = amplifyConfigure;
const amplifyConfigureBeforeOrAtV10_7 = (settings) => {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    const missingParam = MANDATORY_PARAMS.filter((p) => !Object.keys(s).includes(p));
    if (missingParam.length) {
        throw new Error(`mandatory params ${missingParam.join(' ')} are missing`);
    }
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['configure'], { stripColors: true })
            .wait('Sign in to your AWS administrator account:')
            .wait('Press Enter to continue')
            .sendCarriageReturn()
            .wait('Specify the AWS Region');
        (0, __1.singleSelect)(chain, s.region, exports.amplifyRegions);
        chain
            .wait('user name:')
            .sendCarriageReturn()
            .wait('Press Enter to continue')
            .sendCarriageReturn()
            .wait('accessKeyId')
            .pauseRecording()
            .sendLine(s.accessKeyId)
            .wait('secretAccessKey')
            .sendLine(s.secretAccessKey)
            .resumeRecording()
            .wait('Profile Name:')
            .sendLine(s.profileName)
            .wait('Successfully set up the new user.')
            .run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
};
exports.amplifyConfigureBeforeOrAtV10_7 = amplifyConfigureBeforeOrAtV10_7;
// TODO amplify admin enabled case
function amplifyConfigureProject(settings) {
    const { cwd, enableContainers = false, profileOption = profileOptions[0], authenticationOption, configLevel = 'project', region = defaultSettings.region, } = settings;
    return new Promise((resolve, reject) => {
        const chain = (0, __1.nspawn)((0, __1.getCLIPath)(), ['configure', 'project'], { cwd, stripColors: true }).wait('Which setting do you want to configure?');
        if (enableContainers) {
            (0, __1.singleSelect)(chain, configurationOptions[2], configurationOptions);
            chain.wait('Do you want to enable container-based deployments?').sendConfirmYes();
        }
        else {
            (0, __1.singleSelect)(chain, configurationOptions[1], configurationOptions);
            if (configLevel === 'project') {
                chain.wait('Do you want to update or remove the project level AWS profile?');
                (0, __1.singleSelect)(chain, profileOption, profileOptions);
            }
            else {
                chain.wait('Do you want to set the project level configuration').sendConfirmYes();
            }
            if (profileOption === profileOptions[1] || configLevel === 'general') {
                chain.wait('Select the authentication method you want to use:');
                (0, __1.singleSelect)(chain, authenticationOption, authenticationOptions);
                if (authenticationOption === authenticationOptions[0]) {
                    chain.wait('Please choose the profile you want to use').sendCarriageReturn(); // Default profile
                }
                else if (authenticationOption === authenticationOptions[1]) {
                    chain.wait('accessKeyId:').sendLine(process.env.AWS_ACCESS_KEY_ID);
                    chain.wait('secretAccessKey:').sendLine(process.env.AWS_SECRET_ACCESS_KEY);
                    chain.wait('region:');
                    (0, __1.singleSelect)(chain, region, exports.amplifyRegions);
                }
            }
        }
        chain.wait('Successfully made configuration changes to your project.').run((err) => {
            if (!err) {
                resolve();
            }
            else {
                reject(err);
            }
        });
    });
}
exports.amplifyConfigureProject = amplifyConfigureProject;
//# sourceMappingURL=index.js.map