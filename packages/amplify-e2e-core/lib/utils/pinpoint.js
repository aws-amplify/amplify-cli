"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.amplifyDelete = exports.pushToCloud = exports.addPinpointAnalytics = exports.initProjectForPinpoint = exports.pinpointAppExist = void 0;
const aws_sdk_1 = require("aws-sdk");
const lodash_1 = __importDefault(require("lodash"));
const os_1 = require("os");
const __1 = require("..");
const settings = {
    name: os_1.EOL,
    envName: 'test',
    editor: os_1.EOL,
    appType: os_1.EOL,
    framework: os_1.EOL,
    srcDir: os_1.EOL,
    distDir: os_1.EOL,
    buildCmd: os_1.EOL,
    startCmd: os_1.EOL,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN,
    region: process.env.CLI_REGION,
    pinpointResourceName: 'testpinpoint',
};
const defaultPinpointRegion = 'us-east-1';
const serviceRegionMap = {
    'us-east-1': 'us-east-1',
    'us-east-2': 'us-east-1',
    'sa-east-1': 'us-east-1',
    'ca-central-1': 'ca-central-1',
    'us-west-1': 'us-west-2',
    'us-west-2': 'us-west-2',
    'cn-north-1': 'us-west-2',
    'cn-northwest-1': 'us-west-2',
    'ap-south-1': 'ap-south-1',
    'ap-northeast-3': 'us-west-2',
    'ap-northeast-2': 'ap-northeast-2',
    'ap-southeast-1': 'ap-southeast-1',
    'ap-southeast-2': 'ap-southeast-2',
    'ap-northeast-1': 'ap-northeast-1',
    'eu-central-1': 'eu-central-1',
    'eu-north-1': 'eu-central-1',
    'eu-south-1': 'eu-central-1',
    'eu-west-1': 'eu-west-1',
    'eu-west-2': 'eu-west-2',
    'eu-west-3': 'eu-west-1',
    'me-south-1': 'ap-south-1',
};
/**
 * checks to see if the pinpoint app exists
 */
function pinpointAppExist(pinpointProjectId) {
    return __awaiter(this, void 0, void 0, function* () {
        let result = false;
        const pinpointClient = new aws_sdk_1.Pinpoint({
            accessKeyId: settings.accessKeyId,
            secretAccessKey: settings.secretAccessKey,
            sessionToken: settings.sessionToken,
            region: lodash_1.default.get(serviceRegionMap, settings.region, defaultPinpointRegion),
        });
        try {
            const response = yield pinpointClient
                .getApp({
                ApplicationId: pinpointProjectId,
            })
                .promise();
            if (response.ApplicationResponse.Id === pinpointProjectId) {
                result = true;
            }
        }
        catch (err) {
            if (err.code === 'NotFoundException') {
                result = false;
            }
            else {
                throw err;
            }
        }
        return result;
    });
}
exports.pinpointAppExist = pinpointAppExist;
/**
 * initializes a project to test pinpoint
 */
function initProjectForPinpoint(cwd) {
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
            .sendLine(settings.name)
            .wait('Initialize the project with the above configuration?')
            .sendConfirmNo()
            .wait('Enter a name for the environment')
            .sendLine(settings.envName)
            .wait('Choose your default editor:')
            .sendLine(settings.editor)
            .wait("Choose the type of app that you're building")
            .sendLine(settings.appType)
            .wait('What javascript framework are you using')
            .sendLine(settings.framework)
            .wait('Source Directory Path:')
            .sendLine(settings.srcDir)
            .wait('Distribution Directory Path:')
            .sendLine(settings.distDir)
            .wait('Build Command:')
            .sendLine(settings.buildCmd)
            .wait('Start Command:')
            .sendCarriageReturn()
            .wait('Using default provider  awscloudformation')
            .wait('Select the authentication method you want to use:')
            .send(__1.KEY_DOWN_ARROW)
            .sendCarriageReturn()
            .pauseRecording()
            .wait('accessKeyId')
            .sendLine(settings.accessKeyId)
            .wait('secretAccessKey')
            .sendLine(settings.secretAccessKey)
            .resumeRecording()
            .wait('region');
        (0, __1.singleSelect)(chain, settings.region, __1.amplifyRegions);
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
exports.initProjectForPinpoint = initProjectForPinpoint;
/**
 * adds a pinpoint resource, you may specific a name for the resource
 */
function addPinpointAnalytics(cwd, testingWithLatestCodebase = true, pinPointResourceName) {
    const resourceName = pinPointResourceName || settings.pinpointResourceName;
    return new Promise((resolve, reject) => {
        (0, __1.nspawn)((0, __1.getCLIPath)(testingWithLatestCodebase), ['add', 'analytics'], { cwd, stripColors: true })
            .wait('Select an Analytics provider')
            .sendCarriageReturn()
            .wait('Provide your pinpoint resource name:')
            .sendLine(resourceName)
            .wait('Apps need authorization to send analytics events. Do you want to allow guests')
            .sendConfirmNo()
            .wait(`Successfully added resource ${resourceName} locally`)
            .sendEof()
            .run((err) => {
            if (!err) {
                resolve(resourceName);
            }
            else {
                reject(err);
            }
        });
    });
}
exports.addPinpointAnalytics = addPinpointAnalytics;
/**
 * calls amplify push and verifies that the pinpoint resource succeeds
 */
const pushToCloud = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['push'], { cwd, stripColors: true })
        .wait('Are you sure you want to continue')
        .sendCarriageReturn()
        .wait('Pinpoint URL to track events')
        .runAsync();
});
exports.pushToCloud = pushToCloud;
/**
 * delete the project
 */
const amplifyDelete = (cwd) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['delete'], { cwd, stripColors: true })
        .wait('Are you sure you want to continue?')
        .sendYes()
        .wait('Project deleted in the cloud')
        .wait('Project deleted locally.')
        .runAsync();
});
exports.amplifyDelete = amplifyDelete;
//# sourceMappingURL=pinpoint.js.map