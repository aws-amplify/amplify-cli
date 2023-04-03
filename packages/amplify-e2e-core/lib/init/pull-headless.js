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
exports.getAmplifyPullConfig = exports.nonInteractivePullAttach = exports.pullProject = void 0;
const execa_1 = __importDefault(require("execa"));
const os_1 = require("os");
// eslint-disable-next-line import/no-cycle
const __1 = require("..");
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
    appId: '',
};
/**
 * Executes amplify pull
 */
const pullProject = (cwd, settings) => {
    const s = Object.assign(Object.assign({}, defaultSettings), settings);
    return (0, __1.nspawn)((0, __1.getCLIPath)(), ['pull', '--appId', s.appId, '--envName', s.envName], { cwd, stripColors: true })
        .wait('Select the authentication method you want to use:')
        .sendLine(s.useProfile)
        .wait('Please choose the profile you want to use')
        .sendLine(s.profileName)
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
        .wait('Do you plan on modifying this backend?')
        .sendConfirmNo()
        .wait('Added backend environment config object to your project.')
        .runAsync();
};
exports.pullProject = pullProject;
/**
 * Executes non-interactive pull command
 */
const nonInteractivePullAttach = (projRoot, amplifyPullConfig, categoriesConfig, awsProviderConfig = (0, __1.getAwsProviderConfig)()) => __awaiter(void 0, void 0, void 0, function* () {
    const args = [
        'pull',
        '--yes',
        '--amplify',
        JSON.stringify(amplifyPullConfig),
        '--providers',
        JSON.stringify({
            awscloudformation: awsProviderConfig,
        }),
    ];
    if (categoriesConfig) {
        args.push('--categories', JSON.stringify(categoriesConfig));
    }
    yield (0, execa_1.default)((0, __1.getCLIPath)(), args, { cwd: projRoot });
});
exports.nonInteractivePullAttach = nonInteractivePullAttach;
/**
 * Returns a default AmplifyPullConfig
 */
const getAmplifyPullConfig = (projectName, envName, appId) => ({
    projectName,
    envName,
    appId,
    defaultEditor: 'code',
});
exports.getAmplifyPullConfig = getAmplifyPullConfig;
//# sourceMappingURL=pull-headless.js.map